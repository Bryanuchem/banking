import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Pagination({
  total,
  limit,
  offset,
  onOffsetChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  const pageCount = Math.max(
    1,
    Math.ceil(total / limit),
  );
  const page =
    Math.floor(offset / limit) + 1;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
      style={{ borderColor: "var(--border)" }}
    >
      <p
        className="text-xs"
        style={{ color: "var(--muted)" }}
      >
        {total === 0
          ? "No results"
          : `Showing ${offset + 1}–${Math.min(
              offset + limit,
              total,
            )} of ${total.toLocaleString()}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg border disabled:opacity-40"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          disabled={page <= 1}
          onClick={() =>
            onOffsetChange(
              Math.max(0, offset - limit),
            )
          }
        >
          <ChevronLeft size={16} />
        </button>

        <span
          className="min-w-20 text-center text-xs font-medium"
          style={{ color: "var(--text)" }}
        >
          {page} / {pageCount}
        </span>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg border disabled:opacity-40"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          disabled={page >= pageCount}
          onClick={() =>
            onOffsetChange(offset + limit)
          }
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
