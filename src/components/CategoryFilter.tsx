import { Settings2 } from "lucide-react";
import type { Category, TaskInstance } from "../types";

interface CategoryFilterProps {
  categories: Category[];
  instances: TaskInstance[];
  filter: string | null;
  onFilter: (id: string | null) => void;
  onManage: () => void;
}

export function CategoryFilter({
  categories,
  instances,
  filter,
  onFilter,
  onManage,
}: CategoryFilterProps) {
  const countFor = (id: string) => instances.filter((i) => i.categoryId === id).length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter timeline by category">
      <button
        onClick={() => onFilter(null)}
        aria-pressed={filter === null}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
          filter === null
            ? "border-ink bg-ink text-paper"
            : "border-line bg-panel text-soft hover:text-ink"
        }`}
      >
        All
      </button>
      {categories.map((c) => {
        const n = countFor(c.id);
        const active = filter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onFilter(active ? null : c.id)}
            aria-pressed={active}
            title={n === 0 ? `${c.label} — nothing planned this day` : c.label}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              active ? "text-ink" : "border-line bg-panel text-soft hover:text-ink"
            }`}
            style={
              active
                ? {
                    borderColor: `color-mix(in srgb, ${c.color} 55%, var(--line))`,
                    background: `color-mix(in srgb, ${c.color} 14%, var(--panel))`,
                  }
                : undefined
            }
          >
            <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
            {c.label}
            <span className={`text-[10px] font-bold ${active ? "text-soft" : "text-mute"}`}>
              {n}
            </span>
          </button>
        );
      })}
      <button
        onClick={onManage}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-soft hover:text-ink"
        aria-label="Manage categories"
      >
        <Settings2 size={13} aria-hidden />
        Manage
      </button>
    </div>
  );
}
