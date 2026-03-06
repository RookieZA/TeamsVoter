import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// In a real production app, this would be a Redis or Database.
// Since this app runs as a single Docker container, we can use a global in-memory store
// to relay votes between the join screen and the host screen.
const globalAny = global as any;
if (!globalAny.votesStore) {
    globalAny.votesStore = new Map<string, Record<string, number>>();
}
const store: Map<string, Record<string, number>> = globalAny.votesStore;

export async function POST(request: Request) {
    try {
        const { hostId, choiceId } = await request.json();

        if (!hostId || !choiceId) {
            return NextResponse.json({ error: 'Missing hostId or choiceId' }, { status: 400 });
        }

        // Initialize host poll if it doesn't exist
        if (!store.has(hostId)) {
            store.set(hostId, {});
        }

        const pollVotes = store.get(hostId)!;

        // Increment the vote count for this choice
        pollVotes[choiceId] = (pollVotes[choiceId] || 0) + 1;

        return NextResponse.json({ success: true, votes: pollVotes });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('hostId');

    if (!hostId) {
        return NextResponse.json({ error: 'Missing hostId' }, { status: 400 });
    }

    const pollVotes = store.get(hostId) || {};

    return NextResponse.json({ votes: pollVotes });
}
