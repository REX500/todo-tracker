"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ExternalLink, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TodoFormFields, emptyTodoForm, type TodoFormValues } from "@/components/todo-form-fields";
import { TagBadge } from "@/components/tag-badge";
import { DeadlineChip } from "@/components/deadline-chip";
import type { Todo } from "@/lib/types";
import type { Status } from "@/lib/schema";
import { tagColors } from "@/lib/tag-colors";
import { deadlineStatus } from "@/lib/deadline";

const STATUS_OPTIONS: Array<"all" | Status> = ["all", "To Do", "In Progress", "Done"];

function toFormValues(t: Todo): TodoFormValues {
  return {
    task: t.task,
    status: t.status,
    tag: t.tag ?? "",
    stakeholder: t.stakeholder ?? "",
    deadline: t.deadline ?? "",
    url: t.url ?? "",
    notes: t.notes ?? ""
  };
}

function formToInput(v: TodoFormValues): unknown {
  return {
    task: v.task,
    status: v.status,
    tag: v.tag,
    stakeholder: v.stakeholder,
    deadline: v.deadline,
    url: v.url,
    notes: v.notes
  };
}

const statusBadgeClass: Record<Status, string> = {
  "To Do": "bg-secondary text-muted-foreground border-border",
  "In Progress": "bg-primary/15 text-primary border-primary/40",
  Done: "bg-[hsl(var(--done-bg))] text-[hsl(var(--done))] border-[hsl(var(--done))]/40"
};

export function ListView({ initialTodos }: { initialTodos: Todo[] }) {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [tagFilter, setTagFilter] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");
  const [addValues, setAddValues] = useState<TodoFormValues>(emptyTodoForm);
  const [editing, setEditing] = useState<{ id: number; values: TodoFormValues } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/todos");
        if (!res.ok) return;
        const data = (await res.json()) as { todos: Todo[] };
        if (!cancelled) setTodos(data.todos);
      } catch {
        /* keep server-rendered todos */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    todos.forEach((t) => {
      if (t.tag) s.add(t.tag);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [todos]);

  const stats = useMemo(
    () => ({
      total: todos.length,
      done: todos.filter((t) => t.status === "Done").length,
      inProgress: todos.filter((t) => t.status === "In Progress").length,
      tagged: todos.filter((t) => !!t.tag).length
    }),
    [todos]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (tagFilter !== "all" && t.tag !== tagFilter) return false;
      if (q) {
        const haystack = [t.task, t.tag ?? "", t.stakeholder ?? "", t.notes ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [todos, statusFilter, tagFilter, search]);

  async function refresh() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) return;
      const data = (await res.json()) as { todos: Todo[] };
      setTodos(data.todos);
    } catch {
      /* keep stale state */
    }
    router.refresh();
  }

  async function withBusy<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (!addValues.task.trim()) return;
    await withBusy(async () => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToInput(addValues))
      });
      if (!res.ok) throw new Error(await readError(res));
      setAddValues(emptyTodoForm);
      await refresh();
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this todo?")) return;
    await withBusy(async () => {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      await refresh();
    });
  }

  async function handleToggleDone(t: Todo) {
    const nextStatus: Status = t.status === "Done" ? "To Do" : "Done";
    await withBusy(async () => {
      const res = await fetch(`/api/todos/${t.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error(await readError(res));
      await refresh();
    });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editing.values.task.trim()) return;
    await withBusy(async () => {
      const res = await fetch(`/api/todos/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToInput(editing.values))
      });
      if (!res.ok) throw new Error(await readError(res));
      setEditing(null);
      await refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">My Todos</h1>
        <p className="text-sm text-muted-foreground mt-1">Track tasks across statuses and tags.</p>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Done", value: stats.done },
          { label: "In progress", value: stats.inProgress },
          { label: "Tagged", value: stats.tagged }
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add a todo</h2>
        <TodoFormFields
          idPrefix="new"
          value={addValues}
          tagSuggestions={allTags}
          onChange={setAddValues}
          onSubmitShortcut={handleAdd}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAddValues(emptyTodoForm)} disabled={busy}>
            Clear
          </Button>
          <Button onClick={handleAdd} disabled={busy || !addValues.task.trim()}>
            Add todo
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Status</span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={statusFilter === opt ? "default" : "outline"}
              onClick={() => setStatusFilter(opt)}
            >
              {opt === "all" ? "All" : opt}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Tags</span>
          <Button
            size="sm"
            variant={tagFilter === "all" ? "default" : "outline"}
            onClick={() => setTagFilter("all")}
          >
            All tags
          </Button>
          {allTags.map((t) => {
            const c = tagColors(t);
            const active = tagFilter === t;
            return (
              <Button
                key={t}
                size="sm"
                variant="outline"
                onClick={() => setTagFilter(t)}
                style={
                  active
                    ? { color: c.color, background: c.background, borderColor: c.border }
                    : undefined
                }
              >
                {t}
              </Button>
            );
          })}
        </div>
        <Input
          placeholder="Search todos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            <div className="text-3xl mb-2">📋</div>
            {todos.length === 0 ? "No todos yet — add one above!" : "No todos match your filters."}
          </div>
        ) : (
          filtered.map((t) => {
            const ds = deadlineStatus(t.deadline, t.status);
            const cardCls =
              ds === "overdue"
                ? "border-[hsl(var(--high))] shadow-[0_0_0_2px_hsl(var(--high)/0.3)]"
                : ds === "soon"
                ? "border-[hsl(var(--warning))] shadow-[0_0_0_2px_hsl(var(--warning)/0.25)]"
                : "border-border";
            const done = t.status === "Done";
            return (
              <div
                key={t.id}
                className={`flex gap-3 rounded-lg border bg-card p-4 ${cardCls} ${done ? "opacity-60" : ""}`}
              >
                <button
                  aria-label={done ? "Mark incomplete" : "Mark done"}
                  className={`mt-1 h-5 w-5 shrink-0 rounded border-2 transition-colors ${
                    done
                      ? "bg-[hsl(var(--done))] border-[hsl(var(--done))]"
                      : "border-muted-foreground hover:border-primary"
                  }`}
                  onClick={() => handleToggleDone(t)}
                  disabled={busy}
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${done ? "line-through" : ""}`}>{t.task}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[t.status]}`}>
                      {t.status}
                    </span>
                    {t.tag && <TagBadge tag={t.tag} />}
                    <DeadlineChip deadline={t.deadline} status={t.status} />
                    {t.stakeholder && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {t.stakeholder}
                      </span>
                    )}
                    {t.created_at && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {t.url && (
                    <div className="mt-2 text-xs">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t.url}
                      </a>
                    </div>
                  )}
                  {t.notes && <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{t.notes}</div>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ id: t.id, values: toFormValues(t) })} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit todo</DialogTitle>
          </DialogHeader>
          {editing && (
            <TodoFormFields
              idPrefix="edit"
              value={editing.values}
              tagSuggestions={allTags}
              onChange={(values) => setEditing({ id: editing.id, values })}
              onSubmitShortcut={handleSaveEdit}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={busy || !editing?.values.task.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

