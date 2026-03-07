"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeData, getOrCreateVoterId } from "@/lib/utils";
import { usePeerConnection } from "@/hooks/usePeerConnection";
import { usePollStore } from "@/lib/store";
import { CheckCircle2, AlertTriangle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JoinQuestion {
    q: string;
    c: { i: string; l: string }[];
}

function JoinScreen() {
    const searchParams = useSearchParams();
    const peerId = searchParams.get("peerId");
    const dataB64 = searchParams.get("d");

    const [poll, setPoll] = useState<JoinQuestion | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [voted, setVoted] = useState(false);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    const { status, sendVote } = usePeerConnection(peerId || "");
    const addVote = usePollStore((state) => state.addVote);

    useEffect(() => {
        setIsMounted(true);
        if (dataB64) {
            const decoded = decodeData<JoinQuestion>(dataB64);
            if (decoded && decoded.q && decoded.c) {
                setPoll(decoded);
            } else {
                setError("Invalid poll data.");
            }
        } else {
            setError("No poll data found in URL.");
        }
    }, [dataB64]);

    if (!peerId) {
        return <ErrorState message="Missing Host ID in URL." />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!isMounted) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (!poll) return null;

    const handleVote = async () => {
        if (!selected || voted) return;

        const voterId = getOrCreateVoterId();

        // Attempt to send vote via PeerJS (works cross-device).
        // This may fail silently if PeerJS can't connect in same-browser scenarios.
        sendVote(selected, voterId);

        // Always update the shared Zustand store directly as a reliable fallback.
        // Since usePollStore uses zustand-persist (localStorage), all tabs in the
        // same browser share the same state — the host tab will see the update instantly.
        addVote(selected, voterId);
        setVoted(true);

        // Also send to the global API relay for production environments
        // where PeerJS fails and localStorage is on different devices.
        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostId: peerId, choiceId: selected, voterId })
            });
        } catch (error) {
            console.error("Failed to relay vote via API", error);
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">

                {/* Header */}
                <div className="p-6 border-b border-border bg-background/20 relative">
                    <h1 className="text-2xl font-bold pr-16">{poll.q}</h1>
                    <div className="absolute top-6 right-6 flex flex-col items-end">
                        <StatusIcon status={status} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {!voted ? (
                            <motion.div
                                key="voting"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                {poll.c.map((choice) => (
                                    <button
                                        key={choice.i}
                                        onClick={() => setSelected(choice.i)}
                                        className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${selected === choice.i
                                            ? "border-primary bg-primary/20 scale-[1.02]"
                                            : "border-border hover:bg-white/5"
                                            }`}
                                    >
                                        <span className="font-medium text-lg">{choice.l}</span>
                                        {selected === choice.i && (
                                            <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />
                                        )}
                                    </button>
                                ))}

                                <button
                                    onClick={handleVote}
                                    disabled={!selected || voted}
                                    className="w-full mt-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Vote <Send className="w-4 h-4 ml-2" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="voted"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Vote Submitted!</h2>
                                <p className="text-foreground/70">Look at the Host's screen to see real-time results.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </main>
    );
}

function StatusIcon({ status }: { status: string }) {
    if (status === "connecting") {
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
    if (status === "connected") {
        return <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>;
    }
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
}

function ErrorState({ message }: { message: string }) {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="glass p-8 rounded-2xl flex flex-col items-center text-center max-w-sm">
                <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p className="text-foreground/70">{message}</p>
            </div>
        </main>
    );
}

export default function JoinPoll() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <JoinScreen />
        </Suspense>
    );
}
