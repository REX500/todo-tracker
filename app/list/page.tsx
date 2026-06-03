import { listTodos } from "@/lib/db";
import { ImportBanner } from "@/components/import-banner";
import { ListView } from "@/components/list-view";

export const dynamic = "force-dynamic";

export default async function ListPage() {
  const todos = await listTodos();
  return (
    <main>
      <ImportBanner />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ListView initialTodos={todos} />
      </div>
    </main>
  );
}
