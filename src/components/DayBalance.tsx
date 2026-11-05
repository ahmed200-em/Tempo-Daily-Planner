import { useMemo } from "react";
import { PieChart, Plus } from "lucide-react";
import type { Category, TaskInstance } from "../types";
import { dayCoverage, fmtDur, fmtTime } from "../lib/time";

interface DayBalanceProps {
  instances: TaskInstance[];
  categoryById: Map<string, Category>;
  nowMin: number | null;
  onPlanGap: (startMin: number, durationMin: number) => void;
}

export function DayBalance({
  instances,
  categoryById,
  nowMin,
  onPlanGap,
}: DayBalanceProps) {
  const { segments, planned, free, gap } = useMemo(() => {
    const active = instances.filter((i) => i.status !== "skipped");
    const cov = dayCoverage(active, { from: nowMin ?? 0, minRun: 45 });

    const segs = [...cov.perCategory.entries()]
      .map(([id, minutes]) => ({
        id,
        minutes,
        label: categoryById.get(id)?.label ?? "Other",
        color: categoryById.get(id)?.color ?? "#8d8578",
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // the longest open stretch still ahead of you
    const best = cov.gaps.reduce<{ start: number; end: number; length: number } | null>(
      (a, g) => (a == null || g.length > a.length ? g : a),
      null
    );

    return { segments: segs, planned: cov.planned, free: cov.free, gap: best };
  }, [instances, categoryById, nowMin]);

  if (instances.length === 0) return null;

  const pct = (m: number) => (m / 1440) * 100;

  return (
    <section className="card p-4" aria-label="How the day is allocated">
      <div className="flex items-center gap-1.5 text-mute">
        <PieChart size={13} aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Day balance</p>
        <p className="ml-auto text-[10px] font-bold tabular-nums text-soft">
          {Math.round(pct(planned))}% planned
        </p>
      </div>

      {/* 24h allocation bar */}
      <div
        className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-well"
        role="img"
        aria-label={`${fmtDur(planned)} planned, ${fmtDur(free)} unscheduled`}
      >
        {segments.map((s) => (
          <span
            key={s.id}
            className="h-full transition-all duration-500 first:rounded-l-full"
            style={{ width: `${pct(s.minutes)}%`, background: s.color }}
            title={`${s.label} — ${fmtDur(s.minutes)}`}
          />
        ))}
      </div>

      {/* legend */}
      <ul className="mt-2.5 space-y-1">
        {segments.slice(0, 4).map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-[11px]">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="flex-1 truncate text-soft">{s.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-mute">
              {fmtDur(s.minutes)}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-[11px]">
          <span className="size-1.5 shrink-0 rounded-full bg-line" aria-hidden />
          <span className="flex-1 truncate text-soft">Unscheduled</span>
          <span className="shrink-0 font-semibold tabular-nums text-mute">{fmtDur(free)}</span>
        </li>
      </ul>

      {/* biggest open stretch -> one-click plan */}
      {gap && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[11px] text-soft">
            Longest open stretch{" "}
            <span className="font-semibold tabular-nums text-ink">{fmtDur(gap.length)}</span>{" "}
            <span className="tabular-nums text-mute">from {fmtTime(gap.start)}</span>
          </p>
          <button
            onClick={() => onPlanGap(gap.start, Math.min(gap.length, 90))}
            className="btn-ghost mt-2 w-full justify-center !py-1.5 !text-xs"
          >
            <Plus size={13} aria-hidden />
            Plan something here
          </button>
        </div>
      )}
    </section>
  );
}
