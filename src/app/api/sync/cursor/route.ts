import { NextResponse } from "next/server";
import {
  agentToTrackedChat,
  fetchCursorAgents,
  fetchCursorRun,
} from "@/lib/cursor-agents";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.DESK_CURSOR_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "DESK_CURSOR_API_KEY is not set. Add a Cursor user API key from cursor.com/dashboard → API Keys.",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const { items } = await fetchCursorAgents(apiKey);

    // Enrich the newest agents with latest run status (cap to keep latency low).
    const enriched = await Promise.all(
      items.slice(0, 40).map(async (agent) => {
        if (!agent.latestRunId) {
          return agentToTrackedChat(agent, null);
        }
        const run = await fetchCursorRun(apiKey, agent.id, agent.latestRunId);
        return agentToTrackedChat(agent, run);
      }),
    );

    const rest = items
      .slice(40)
      .map((agent) => agentToTrackedChat(agent, null));

    return NextResponse.json({
      configured: true,
      syncedAt: new Date().toISOString(),
      count: enriched.length + rest.length,
      chats: [...enriched, ...rest],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Cursor agents";
    return NextResponse.json({ error: message, configured: true }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.DESK_CURSOR_API_KEY?.trim()),
    provider: "cursor",
    docs: "https://cursor.com/docs/cloud-agent/api/endpoints",
  });
}
