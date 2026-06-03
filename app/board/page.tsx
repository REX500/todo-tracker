import { listTodos } from "@/lib/db";
import { ImportBanner } from "@/components/import-banner";
import { BoardView } from "@/components/board-view";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const todos = await listTodos();
  return (
    <main>
      <ImportBanner />
      <BoardView initialTodos={todos} />
    </main>
  );
}
