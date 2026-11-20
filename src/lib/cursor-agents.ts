import type { Status, TrackedChat } from "@/lib/types";

export type CursorAgentListItem = {
  id: string;
  name: string;
  status: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  latestRunId?: string | null;
};

export type CursorRun = {
  id: string;
  status: string;
  updatedAt?: string;
};

function mapAgentStatus(
  agentStatus: string,
  runStatus?: string,
): { status: Status; archived: boolean; note: string } {
  const run = (runStatus ?? "").toUpperCase();
  const agent = agentStatus.toUpperCase();

  if (agent === "ARCHIVED") {
    return {
      status: "dormant",
      archived: true,
      note: "Archived in Cursor",
    };
  }

  if (
    run === "RUNNING" ||
    run === "CREATING" ||
    run === "WAITING_FOR_BACKGROUND_WORK" ||
    agent === "ACTIVE" ||
    agent === "CREATING"
  ) {
    return {
      status: "working",
      archived: false,
      note: run ? `Run: ${run}` : `Agent: ${agent}`,
    };
  }

  if (run === "ERROR" || run === "EXPIRED") {
    return {
      status: "needs_approval",
      archived: false,
      note: `Run ended: ${run}`,
    };
  }

  if (run === "CANCELLED") {
    return {
      status: "dormant",
      archived: false,
      note: "Run cancelled",
    };
  }

  if (run === "FINISHED") {
    return {
      status: "done",
      archived: false,
      note: "Latest run finished",
    };
  }

  return {
    status: "done",
    archived: false,
    note: agent ? `Agent: ${agent}` : "Synced from Cursor",
  };
}

export function agentToTrackedChat(
  agent: CursorAgentListItem,
  run?: CursorRun | null,
): TrackedChat {
  const mapped = mapAgentStatus(agent.status, run?.status);
  const createdAt = agent.createdAt ?? new Date().toISOString();
  const updatedAt =
    run?.updatedAt ?? agent.updatedAt ?? createdAt;

  return {
    id: `cursor:${agent.id}`,
    title: agent.name?.trim() || agent.id,
    tool: "cursor",
    kind: "code",
    status: mapped.status,
    note: mapped.note,
    link: agent.url || `https://cursor.com/agents/${agent.id}`,
    createdAt,
    updatedAt,
    archived: mapped.archived,
    source: "cursor",
    externalId: agent.id,
  };
}

export async function fetchCursorAgents(apiKey: string): Promise<{
  items: CursorAgentListItem[];
}> {
  const items: CursorAgentListItem[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 5; page++) {
    const url = new URL("https://api.cursor.com/v1/agents");
    url.searchParams.set("limit", "50");
    url.searchParams.set("includeArchived", "true");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Cursor API ${res.status}: ${text.slice(0, 200) || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      items?: CursorAgentListItem[];
      nextCursor?: string;
    };

    items.push(...(data.items ?? []));
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return { items };
}

export async function fetchCursorRun(
  apiKey: string,
  agentId: string,
  runId: string,
): Promise<CursorRun | null> {
  const res = await fetch(
    `https://api.cursor.com/v1/agents/${agentId}/runs/${runId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as CursorRun;
}
