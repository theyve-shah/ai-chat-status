import { promises as fs } from "fs";
import path from "path";
import type { TrackedChat } from "@/lib/types";

const BUFFER_FILE = path.join(process.cwd(), ".desk-last-import.json");

export type ImportBuffer = {
  syncedAt: string;
  count: number;
  chats: TrackedChat[];
};

export async function writeImportBuffer(chats: TrackedChat[]): Promise<ImportBuffer> {
  const payload: ImportBuffer = {
    syncedAt: new Date().toISOString(),
    count: chats.length,
    chats,
  };
  await fs.writeFile(BUFFER_FILE, JSON.stringify(payload), "utf8");
  return payload;
}

export async function readImportBuffer(): Promise<ImportBuffer | null> {
  try {
    const raw = await fs.readFile(BUFFER_FILE, "utf8");
    const parsed = JSON.parse(raw) as ImportBuffer;
    if (!parsed || !Array.isArray(parsed.chats)) return null;
    return parsed;
  } catch {
    return null;
  }
}
