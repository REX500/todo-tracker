import type { Status, TodoInput } from "./schema";

export type { Status, TodoInput };

export interface Todo {
  id: number;
  task: string;
  status: Status;
  tag: string | null;
  stakeholder: string | null;
  deadline: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
