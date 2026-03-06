import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Choice {
    id: string;
    label: string;
    votes: number;
}

export interface PollState {
    hostId: string | null;
    question: string;
    choices: Choice[];
    setPoll: (hostId: string, question: string, choices: { id: string; label: string }[]) => void;
    addVote: (choiceId: string) => void;
    resetPoll: () => void;
}

export const usePollStore = create<PollState>()(
    persist(
        (set) => ({
            hostId: null,
            question: "",
            choices: [],
            setPoll: (hostId, question, newChoices) => set({
                hostId,
                question,
                choices: newChoices.map(c => ({ ...c, votes: 0 })),
            }),
            addVote: (choiceId) => set((state) => ({
                choices: state.choices.map((c) =>
                    c.id === choiceId ? { ...c, votes: c.votes + 1 } : c
                )
            })),
            resetPoll: () => set({ hostId: null, question: "", choices: [] }),
        }),
        {
            name: 'poll-storage',
        }
    )
);

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'poll-storage') {
            usePollStore.persist.rehydrate();
        }
    });
}
