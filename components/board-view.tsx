"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar, Crosshair, Minus, Pencil, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TodoFormFields, emptyTodoForm, type TodoFormValues } from "@/components/todo-form-fields";
import { TagBadge } from "@/components/tag-badge";
import { tagColors } from "@/lib/tag-colors";
import { deadlineStatus, fmtDeadline } from "@/lib/deadline";
import type { Todo } from "@/lib/types";
import type { Status } from "@/lib/schema";

const UNTAGGED_KEY = "⋯ Untagged";
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;
const PINCH_DELTA = 0.06;

interface Group {
  key: string;
  label: string;
  isUntagged: boolean;
  items: Todo[];
}

function groupTodos(todos: Todo[]): Group[] {
  const buckets = new Map<string, Todo[]>();
  for (const t of todos) {
    const key = t.tag || UNTAGGED_KEY;
    const arr = buckets.get(key) ?? [];
    arr.push(t);
    buckets.set(key, arr);
  }
  const groups: Group[] = [];
  for (const [key, items] of buckets) {
    items.sort((a, b) => {
      const da = new Date(a.created_at).getTime() || a.id;
      const db = new Date(b.created_at).getTime() || b.id;
      return da - db;
    });
    groups.push({ key, label: key === UNTAGGED_KEY ? "Untagged" : key, isUntagged: key === UNTAGGED_KEY, items });
  }
  groups.sort((a, b) => {
    if (a.isUntagged) return 1;
    if (b.isUntagged) return -1;
    return a.key.localeCompare(b.key);
  });
  return groups;
}

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

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

const statusCardClass: Record<Status, string> = {
  "To Do": "border-border",
  "In Progress": "border-l-4 border-l-primary border-border",
  Done: "opacity-40 border-border"
};

export function BoardView({ initialTodos }: { initialTodos: Todo[] }) {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [editing, setEditing] = useState<{ id: number | null; values: TodoFormValues } | null>(null);
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

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const headersBarRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ tx: 0, ty: 0, scale: 1 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [zoomLabel, setZoomLabel] = useState("100%");

  const groups = useMemo(() => groupTodos(todos), [todos]);
  const allTags = useMemo(
    () => groups.filter((g) => !g.isUntagged).map((g) => g.key),
    [groups]
  );

  const updateHeaderPositions = useCallback(() => {
    const canvas = canvasRef.current;
    const bar = headersBarRef.current;
    if (!canvas || !bar) return;
    const { tx, scale } = transformRef.current;
    const cols = canvas.querySelectorAll<HTMLElement>("[data-col]");
    const chips = bar.querySelectorAll<HTMLElement>("[data-chip]");
    const vw = window.innerWidth;
    chips.forEach((chip, i) => {
      const col = cols[i];
      if (!col) return;
      const screenX = col.offsetLeft * scale + tx + (col.offsetWidth * scale) / 2;
      chip.style.left = `${screenX}px`;
      chip.style.opacity = screenX < -60 || screenX > vw + 60 ? "0" : "1";
    });
  }, []);

  const applyTransform = useCallback(
    (animate: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { tx, ty, scale } = transformRef.current;
      canvas.style.transition = animate ? "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)" : "none";
      canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      setZoomLabel(`${Math.round(scale * 100)}%`);
      updateHeaderPositions();
    },
    [updateHeaderPositions]
  );

  const centerBoard = useCallback(
    (animate: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { scale } = transformRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cw = canvas.scrollWidth * scale;
      const ch = canvas.scrollHeight * scale;
      transformRef.current.tx = Math.max((vw - cw) / 2, 40 - cw / 2);
      transformRef.current.ty = (vh - ch) / 2;
      applyTransform(animate);
    },
    [applyTransform]
  );

  const jumpToLatest = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || todos.length === 0) {
      centerBoard(true);
      return;
    }
    const latest = todos.reduce((a, b) => (a.id > b.id ? a : b));
    const cardEl = canvas.querySelector<HTMLElement>(`[data-id="${latest.id}"]`);
    if (!cardEl) {
      centerBoard(true);
      return;
    }
    const { scale } = transformRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let el: HTMLElement | null = cardEl;
    let ox = 0;
    let oy = 0;
    while (el && el !== canvas) {
      ox += el.offsetLeft;
      oy += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    transformRef.current.tx = vw / 2 - (ox + cardEl.offsetWidth / 2) * scale;
    transformRef.current.ty = vh / 2 - (oy + cardEl.offsetHeight / 2) * scale;
    applyTransform(true);
  }, [todos, applyTransform, centerBoard]);

  // Wire pointer / wheel handlers on mount.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a") || target.closest("button") || target.closest("input") || target.closest("textarea")) {
        return;
      }
      draggingRef.current = true;
      startRef.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.tx, ty: transformRef.current.ty };
      viewport.classList.add("cursor-grabbing");
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      transformRef.current.tx = startRef.current.tx + (e.clientX - startRef.current.x);
      transformRef.current.ty = startRef.current.ty + (e.clientY - startRef.current.y);
      applyTransform(false);
    };
    const onMouseUp = () => {
      draggingRef.current = false;
      viewport.classList.remove("cursor-grabbing");
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      startRef.current.tx = transformRef.current.tx;
      startRef.current.ty = transformRef.current.ty;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      transformRef.current.tx = startRef.current.tx + (e.touches[0].clientX - touchStartX);
      transformRef.current.ty = startRef.current.ty + (e.touches[0].clientY - touchStartY);
      applyTransform(false);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { scale, tx, ty } = transformRef.current;
      if (e.ctrlKey) {
        const delta = e.deltaY > 0 ? -PINCH_DELTA : PINCH_DELTA;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        transformRef.current.tx = mx - (mx - tx) * (newScale / scale);
        transformRef.current.ty = my - (my - ty) * (newScale / scale);
        transformRef.current.scale = newScale;
      } else {
        transformRef.current.tx -= e.deltaX;
        transformRef.current.ty -= e.deltaY;
      }
      applyTransform(false);
    };

    const onResize = () => updateHeaderPositions();

    viewport.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: true });
    viewport.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      viewport.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, [applyTransform, updateHeaderPositions]);

  // Centre on initial mount and on group set changes.
  useEffect(() => {
    const t = setTimeout(() => jumpToLatest(), 50);
    return () => clearTimeout(t);
    // We deliberately depend only on the count — re-centring after every
    // single content edit would yank the viewport while the user is working.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  function adjustZoom(delta: number) {
    transformRef.current.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transformRef.current.scale + delta));
    applyTransform(true);
  }

  function resetZoom() {
    transformRef.current.scale = 1;
    centerBoard(false);
  }

  async function refresh() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) return;
      const data = (await res.json()) as { todos: Todo[] };
      setTodos(data.todos);
    } catch {
      /* keep state */
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

  function openAdd(preTag: string) {
    setEditing({ id: null, values: { ...emptyTodoForm, tag: preTag } });
  }

  function openEdit(t: Todo) {
    setEditing({ id: t.id, values: toFormValues(t) });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.values.task.trim()) return;
    await withBusy(async () => {
      const url = editing.id === null ? "/api/todos" : `/api/todos/${editing.id}`;
      const method = editing.id === null ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToInput(editing.values))
      });
      if (!res.ok) throw new Error(await readError(res));
      setEditing(null);
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

  return (
    <div className="board-dotgrid relative h-[calc(100vh-56px)] overflow-hidden">
      {/* HUD */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-lg border bg-card/85 backdrop-blur px-2 py-1.5 shadow">
        <Button size="icon" variant="ghost" onClick={() => adjustZoom(-0.1)} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono w-12 text-center">{zoomLabel}</span>
        <Button size="icon" variant="ghost" onClick={() => adjustZoom(0.1)} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={resetZoom}>Reset</Button>
        <Button size="sm" variant="ghost" onClick={jumpToLatest}>
          <Crosshair className="h-4 w-4" />
          Jump to latest
        </Button>
      </div>
      <div className="absolute top-3 right-3 z-20">
        <Button size="sm" onClick={() => openAdd("")}>
          <Plus className="h-4 w-4" />
          New todo
        </Button>
      </div>

      {/* Sticky header chips */}
      <div ref={headersBarRef} className="pointer-events-none absolute left-0 right-0 top-14 h-10 z-10 overflow-hidden">
        {groups.map((g, i) => {
          const c = g.isUntagged ? null : tagColors(g.key);
          return (
            <div
              key={g.key}
              data-chip
              className="absolute -translate-x-1/2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow"
              style={
                c
                  ? { color: c.color, background: c.background, borderColor: c.border, transitionProperty: "left, opacity", transitionDuration: "0.15s" }
                  : { color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))", transitionProperty: "left, opacity", transitionDuration: "0.15s" }
              }
            >
              {g.label}
              <span className="opacity-70 font-mono">{g.items.length}</span>
              {/* keep i in the data attribute for header alignment */}
              <span className="sr-only" data-i={i} />
            </div>
          );
        })}
      </div>

      {/* Viewport / canvas */}
      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab"
        style={{ zIndex: 1 }}
      >
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 flex flex-row items-start gap-14"
          style={{ padding: "130px 80px 160px", transformOrigin: "0 0", willChange: "transform" }}
        >
          {groups.map((g) => {
            const c = g.isUntagged ? null : tagColors(g.key);
            return (
              <div key={g.key} data-col className="w-60 flex flex-col items-center shrink-0">
                <div className="w-full mb-5 flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={
                      c
                        ? { color: c.color, background: c.background, borderColor: c.border }
                        : { color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {g.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{g.items.length}</span>
                </div>
                <div className="w-full flex flex-col gap-3">
                  {g.items.map((t) => {
                    const ds = deadlineStatus(t.deadline, t.status);
                    const cardBorder =
                      ds === "overdue"
                        ? "border-[hsl(var(--high))] shadow-[0_0_0_2px_hsl(var(--high)/0.35)]"
                        : ds === "soon"
                        ? "border-[hsl(var(--warning))] shadow-[0_0_0_2px_hsl(var(--warning)/0.3)]"
                        : "";
                    return (
                      <div
                        key={t.id}
                        data-id={t.id}
                        className={`group relative rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow ${statusCardClass[t.status]} ${cardBorder}`}
                      >
                        {ds === "overdue" && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[hsl(0_70%_60%/0.18)] text-[hsl(0_80%_72%)] px-2 py-0.5 text-[0.65rem] font-bold pulse-red">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </div>
                        )}
                        <div className="font-medium text-sm leading-snug">{t.task}</div>
                        {t.deadline && (
                          <div
                            className={`mt-2 inline-flex items-center gap-1 text-[0.7rem] font-semibold ${
                              ds === "overdue"
                                ? "text-[hsl(0_80%_72%)]"
                                : ds === "soon"
                                ? "text-[hsl(33_86%_60%)]"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {ds === "soon" ? "Due soon" : "Due"} {fmtDeadline(t.deadline)}
                          </div>
                        )}
                        {t.stakeholder && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                            <User className="h-3 w-3" />
                            {t.stakeholder}
                          </div>
                        )}
                        {t.url && (
                          <div className="mt-1 text-[0.7rem]">
                            <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                              {t.url}
                            </a>
                          </div>
                        )}
                        {t.notes && <div className="mt-1 text-[0.72rem] text-muted-foreground whitespace-pre-wrap">{t.notes}</div>}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(t); }} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} aria-label="Delete">
                            <span aria-hidden>×</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    className="w-full border-dashed text-xs text-muted-foreground"
                    onClick={() => openAdd(g.isUntagged ? "" : g.key)}
                  >
                    <Plus className="h-3 w-3" />
                    Add to {g.label}
                  </Button>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="text-muted-foreground p-12">No todos yet — click &quot;New todo&quot; to create one.</div>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute bottom-3 left-3 z-20 rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id === null ? "New todo" : "Edit todo"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <TodoFormFields
              idPrefix="board"
              value={editing.values}
              tagSuggestions={allTags}
              onChange={(values) => setEditing({ id: editing.id, values })}
              onSubmitShortcut={handleSave}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy || !editing?.values.task.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
