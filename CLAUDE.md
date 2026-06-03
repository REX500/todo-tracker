# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

A zero-dependency personal todo tracker. The entire app is two self-contained HTML files — no build, no package manager, no tests, no server. Each file inlines its own CSS and JS.

- `todo-list.html` — linear list view: add/edit/delete todos, filter by status/tag, search, deadline badges.
- `todo-board.html` — pan/zoom infinite-canvas board: groups the same todos into columns by tag, supports mouse drag, touch drag, trackpad pan, and pinch/Ctrl-wheel zoom.

To run: open either file directly in a browser (`open todo-list.html`). To "deploy": ship the file.

## Shared data contract (important)

Both files read and write the **same `localStorage` key**: `filip_todos`. They are alternate views of one dataset — opening the board after editing the list shows the same todos, and vice versa.

Todo shape (created by `todo-list.html` `addTodo()`, mutated in both files):

```
{ id, task, status, tag, stakeholder, deadline, url, notes, createdAt }
```

`status` is one of `"To Do" | "In Progress" | "Done"`. `deadline` is an ISO date string (`YYYY-MM-DD`) or `""`. `id` is `Date.now()`.

**Any change to the todo shape, the storage key, or the status string set must be applied to BOTH files in the same change** — there is no shared module to update. The same applies to the helpers duplicated across both files: `hashStr`, `tagColors` (deterministic tag → HSL via golden-angle spread), `escHtml`, `deadlineStatus`, `fmtDeadline`.

## Board-specific architecture (`todo-board.html`)

The board uses a single transformed `#canvas` inside a fixed `#viewport`. Pan/zoom is implemented by mutating three globals (`tx`, `ty`, `scale`) and calling `applyTransform()` which sets `canvas.style.transform = translate(...) scale(...)`. The wheel handler distinguishes pinch vs. two-finger pan via `e.ctrlKey` (browsers report pinch gestures with `ctrlKey=true`).

A separate `#headers-bar` renders fixed column-header chips above the canvas; `updateHeaderPositions()` re-projects each chip's `left` from the corresponding column's `offsetLeft` through the current transform every time the canvas moves. If you add a column or change column layout, both `renderBoard()` (which builds the columns) and `renderFixedHeaders()` / `updateHeaderPositions()` must stay in sync — `_lastGroups` / `_lastGroupKeys` are the cached bridge between them.

## Conventions in this repo

- No dependencies, no tooling — keep it that way unless explicitly asked. Don't introduce a bundler, framework, or package.json to "clean things up."
- Both files are vanilla ES (no modules, no imports). All script lives in a single inline `<script>` per file.
- Inline `onclick="..."` handlers are used throughout; functions are global by design. Don't refactor to `addEventListener` without a reason.
- Comments use `// ── Section ──` dividers; preserve the style when adding new sections.
