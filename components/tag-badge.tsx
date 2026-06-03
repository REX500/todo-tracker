import { tagColors } from "@/lib/tag-colors";

export function TagBadge({ tag, className = "" }: { tag: string; className?: string }) {
  const c = tagColors(tag);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${className}`}
      style={{ color: c.color, background: c.background, borderColor: c.border }}
    >
      {tag}
    </span>
  );
}
