"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Could not sign in");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-[#fafafa] p-6 ring-1 ring-[#efefef]"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[#111] text-xs font-semibold text-white">
            D
          </span>
          <div>
            <p className="text-sm font-medium">Desk</p>
            <p className="text-xs text-[#9ca3af]">Private check-in board</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 border-0 bg-white shadow-none ring-1 ring-[#e5e7eb]"
            required
          />
        </div>

        {error ? (
          <p className="mt-3 text-xs text-[#b45353]" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-3 text-xs text-[#9ca3af]">
            Only you should have this password. Connections stay private behind
            this gate.
          </p>
        )}

        <Button type="submit" className="mt-5 h-10 w-full rounded-full" disabled={pending}>
          {pending ? "Signing in…" : "Enter Desk"}
        </Button>
      </form>
    </div>
  );
}
