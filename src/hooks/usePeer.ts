"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DataConnection, Peer } from "peerjs";
import { z } from "zod";

export type VotePayload = {
    type: "VOTE";
    choiceId: string;
    voterId: string;
};

// Zod Schema to validate incoming P2P payloads
const votePayloadSchema = z.object({
    type: z.literal("VOTE"),
    choiceId: z.string().min(1).max(100),
    voterId: z.string().min(1).max(100)
});

export function usePeer(customId?: string, onVote?: (payload: VotePayload, peerId: string) => void) {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const peerInstance = useRef<Peer | null>(null);

    // Keep the latest callback reference to avoid re-triggering useEffect
    const onVoteRef = useRef(onVote);
    useEffect(() => {
        onVoteRef.current = onVote;
    }, [onVote]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            import("peerjs").then(({ default: Peer }) => {
                try {
                    const id = customId || `poll-${Math.random().toString(36).substring(2, 9)}`;
                    const peer = new Peer(id);

                    peer.on("open", (id) => {
                        setPeerId(id);
                    });

                    peer.on("connection", (conn) => {
                        setConnections((prev) => [...prev, conn]);

                        conn.on("data", (data) => {
                            // Validate the incoming data from other peers using Zod
                            const parsed = votePayloadSchema.safeParse(data);
                            if (parsed.success && onVoteRef.current) {
                                onVoteRef.current(parsed.data, conn.peer);
                            } else if (!parsed.success) {
                                console.warn("Received invalid P2P payload format", parsed.error);
                            }
                        });

                        conn.on("close", () => {
                            setConnections((prev) => prev.filter((c) => c.peer !== conn.peer));
                        });
                    });

                    peer.on("error", (err) => {
                        console.error("Host Peer error:", err);
                    });

                    peerInstance.current = peer;
                } catch (error) {
                    console.error("Failed to initialize Host Peer:", error);
                }
            }).catch(err => {
                console.error("Failed to load peerjs:", err);
            });
        }

        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }
        };
    }, [customId]);

    const broadcast = useCallback((data: any) => {
        connections.forEach((conn) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }, [connections]);

    return { peerId, connections, broadcast };
}
