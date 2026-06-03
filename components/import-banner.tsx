"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const LEGACY_KEY = "filip_todos";
const IMPORTED_FLAG = "filip_todos_imported";

type LegacyTodo = Record<string, unknown> & { task?: unknown };

export function ImportBanner() {
  const router = useRouter();
  const [legacy, setLegacy] = useState<LegacyTodo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(IMPORTED_FLAG)) return;
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const items: LegacyTodo[] = parsed.filter(
        (item): item is LegacyTodo =>
          item && typeof item === "object" && typeof (item as { task?: unknown }).task === "string"
      );
      if (items.length === 0) return;
      setLegacy(items);
    } catch {
      // ignore — corrupted localStorage shouldn't block the app
    }
  }, []);

  if (!legacy) return null;

  async function handleImport() {
    if (!legacy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/todos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: legacy })
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Import failed (${res.status})`);
      }
      localStorage.setItem(IMPORTED_FLAG, new Date().toISOString());
      setLegacy(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(IMPORTED_FLAG, "dismissed");
    setLegacy(null);
  }

  return (
    <div className="border-b border-border bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span>
          Found <strong>{legacy.length}</strong> todo{legacy.length === 1 ? "" : "s"} in this browser&apos;s
          local storage. Import them into the database?
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={handleImport} disabled={busy}>
            {busy ? "Importing…" : "Import"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <div className="w-full text-destructive">{error}</div>}
      </div>
    </div>
  );
}
