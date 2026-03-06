"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DataConnection, Peer } from "peerjs";
import { VotePayload } from "./usePeer";

export function usePeerConnection(hostId: string) {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
    const connInstance = useRef<DataConnection | null>(null);
    const peerInstance = useRef<Peer | null>(null);
    const isConnectedRef = useRef(false);

    useEffect(() => {
        if (!hostId || typeof window === "undefined") return;

        let pollInterval: ReturnType<typeof setInterval> | null = null;

        import("peerjs").then(({ default: Peer }) => {
            const peer = new Peer();

            peer.on("open", () => {
                const conn = peer.connect(hostId, { reliable: true });
                connInstance.current = conn;

                // Primary path: listen for the open event
                conn.on("open", () => {
                    if (!isConnectedRef.current) {
                        isConnectedRef.current = true;
                        setStatus("connected");
                    }
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                });

                // Fallback: poll conn.open every 100ms.
                // PeerJS has a known bug where the 'open' event does not fire
                // when both peers are in the same browser context.
                pollInterval = setInterval(() => {
                    if (conn.open && !isConnectedRef.current) {
                        isConnectedRef.current = true;
                        setStatus("connected");
                        clearInterval(pollInterval!);
                        pollInterval = null;
                    }
                }, 100);

                conn.on("close", () => {
                    isConnectedRef.current = false;
                    setStatus("disconnected");
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                });

                conn.on("error", (err) => {
                    console.error("Connection error:", err);
                    isConnectedRef.current = false;
                    setStatus("error");
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                });
            });

            peer.on("error", (err) => {
                console.error("Peer error:", err);
                setStatus("error");
            });

            peerInstance.current = peer;
        });

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            isConnectedRef.current = false;
            if (connInstance.current) connInstance.current.close();
            if (peerInstance.current) peerInstance.current.destroy();
        };
    }, [hostId]);

    const sendVote = useCallback((choiceId: string): boolean => {
        const conn = connInstance.current;
        // Optimistically send if conn.open is true, even if the 'open' event hasn't fired yet.
        // This helps in cases where the event is delayed or doesn't fire due to the PeerJS bug.
        if (conn && (isConnectedRef.current || conn.open)) {
            conn.send({ type: "VOTE", choiceId } as VotePayload);
            return true;
        }
        return false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]); // re-create when status changes so the button reacts

    return { status, sendVote };
}
