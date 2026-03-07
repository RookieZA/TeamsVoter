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
    votedUsers: string[]; // Track which users have already voted
    setPoll: (hostId: string, question: string, choices: { id: string; label: string }[]) => void;
    addVote: (choiceId: string, voterId?: string) => void;
    resetPoll: () => void;
}

export const usePollStore = create<PollState>()(
    persist(
        (set, get) => ({
            hostId: null,
            question: "",
            choices: [],
            votedUsers: [],
            setPoll: (hostId, question, newChoices) => set({
                hostId,
                question,
                choices: newChoices.map(c => ({ ...c, votes: 0 })),
                votedUsers: []
            }),
            addVote: (choiceId, voterId) => {
                const state = get();
                // If a voterId is provided and they already voted, ignore the vote
                if (voterId && state.votedUsers.includes(voterId)) {
                    return;
                }

                set({
                    choices: state.choices.map((c) =>
                        c.id === choiceId ? { ...c, votes: c.votes + 1 } : c
                    ),
                    votedUsers: voterId ? [...state.votedUsers, voterId] : state.votedUsers
                });
            },
            resetPoll: () => set({ hostId: null, question: "", choices: [], votedUsers: [] }),
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
