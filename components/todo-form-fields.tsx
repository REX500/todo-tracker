"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Status } from "@/lib/schema";

export interface TodoFormValues {
  task: string;
  status: Status;
  tag: string;
  stakeholder: string;
  deadline: string;
  url: string;
  notes: string;
}

export const emptyTodoForm: TodoFormValues = {
  task: "",
  status: "To Do",
  tag: "",
  stakeholder: "",
  deadline: "",
  url: "",
  notes: ""
};

interface Props {
  idPrefix: string;
  value: TodoFormValues;
  tagSuggestions: string[];
  onChange: (next: TodoFormValues) => void;
  onSubmitShortcut?: () => void;
}

export function TodoFormFields({ idPrefix, value, tagSuggestions, onChange, onSubmitShortcut }: Props) {
  const set = <K extends keyof TodoFormValues>(key: K, next: TodoFormValues[K]) =>
    onChange({ ...value, [key]: next });

  const datalistId = `${idPrefix}-tag-suggestions`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor={`${idPrefix}-task`}>Task *</Label>
        <Input
          id={`${idPrefix}-task`}
          autoFocus
          placeholder="What needs to be done?"
          value={value.task}
          onChange={(e) => set("task", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmitShortcut) {
              e.preventDefault();
              onSubmitShortcut();
            }
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-status`}>Status</Label>
        <select
          id={`${idPrefix}-status`}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={value.status}
          onChange={(e) => set("status", e.target.value as Status)}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tag`}>Tag</Label>
        <Input
          id={`${idPrefix}-tag`}
          list={datalistId}
          placeholder="e.g. Design, Backend…"
          value={value.tag}
          onChange={(e) => set("tag", e.target.value)}
        />
        <datalist id={datalistId}>
          {tagSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-stakeholder`}>Stakeholder</Label>
        <Input
          id={`${idPrefix}-stakeholder`}
          placeholder="e.g. John Smith"
          value={value.stakeholder}
          onChange={(e) => set("stakeholder", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-deadline`}>Deadline</Label>
        <Input
          id={`${idPrefix}-deadline`}
          type="date"
          value={value.deadline}
          onChange={(e) => set("deadline", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor={`${idPrefix}-url`}>URL / Resource</Label>
        <Input
          id={`${idPrefix}-url`}
          type="url"
          placeholder="https://..."
          value={value.url}
          onChange={(e) => set("url", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          placeholder="Any extra context or details..."
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
    </div>
  );
}
