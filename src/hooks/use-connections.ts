"use client";

import { useEffect, useState } from "react";
import {
  loadConnections,
  saveConnections,
  type ConnectionsState,
  type ToolConnection,
} from "@/lib/connections";
import type { Tool } from "@/lib/types";

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionsState | null>(null);

  useEffect(() => {
    setConnections(loadConnections());
  }, []);

  useEffect(() => {
    if (!connections) return;
    saveConnections(connections);
  }, [connections]);

  function updateTool(tool: Tool, patch: Partial<ToolConnection>) {
    setConnections((prev) => {
      const base = prev ?? loadConnections();
      return {
        ...base,
        [tool]: { ...base[tool], ...patch },
      };
    });
  }

  return {
    connections,
    ready: connections !== null,
    updateTool,
  };
}
