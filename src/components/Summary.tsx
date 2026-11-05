import { Coffee, Hourglass, MoonStar, Sparkles, Target } from "lucide-react";
import type { Category, TaskInstance } from "../types";
import { durationOf, fmtDur, fmtRange, fmtTime, normEnd } from "../lib/time";

interface SummaryProps {
  instances: TaskInstance[];
  categoryById: Map<string, Category>;
  nowMin: number | null; // null when not viewing today
  dateKey: string;
  isToday: boolean;
}

function Ring({ value }: { value: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90" aria-hidden>
      <circle cx="30" cy="30" r={r} fill="none" strokeWidth="6" className="stroke-line" />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-accent transition-all duration-700"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
      />
    </svg>
  );
}

export function Summary({ instances, categoryById, nowMin, isToday }: SummaryProps) {
  const pending = instances.filter((i) => !i.status);
  const completed = instances.filter((i) => i.status === "completed");
  const total = instances.length;
  const remainingMin = pending.reduce((acc, i) => acc + durationOf(i.startMin, i.endMin), 0);

  const isFocus = (i: TaskInstance) => categoryById.get(i.categoryId)?.focus;
  const focusPlanned = instances
    .filter((i) => i.status !== "skipped" && i.status !== "hidden" && isFocus(i))
    .reduce((a, i) => a + durationOf(i.startMin, i.endMin), 0);
  const focusDone = completed
    .filter(isFocus)
    .reduce((a, i) => a + durationOf(i.startMin, i.endMin), 0);

  const breaks = instances.filter((i) => categoryById.get(i.categoryId)?.isBreak && i.status !== "skipped");
  const breakMin = breaks.reduce((a, i) => a + durationOf(i.startMin, i.endMin), 0);
  const sleepMin = instances
    .filter((i) => categoryById.get(i.categoryId)?.isSleep && i.status !== "skipped")
    .reduce((a, i) => a + durationOf(i.startMin, i.endMin), 0);

  const progress = total === 0 ? 0 : completed.length / total;

  const nowTask =
    isToday && nowMin != null
      ? pending.find((i) => nowMin >= i.startMin && nowMin < normEnd(i.startMin, i.endMin))
      : undefined;
  const nextTask = !nowTask
    ? isToday && nowMin != null
      ? pending.find((i) => i.startMin > nowMin)
      : pending[0]
    : undefined;

  return (
    <div className="space-y-3">
      {/* Now / Next highlight */}
      <div className="card relative overflow-hidden p-4">
        {nowTask ? (
          <HighlightContent
            eyebrow="Happening now"
            dotClass="bg-accent animate-pulse"
            title={nowTask.title}
            sub={`${fmtRange(nowTask.startMin, nowTask.endMin)} · ends in ${fmtDur(
              normEnd(nowTask.startMin, nowTask.endMin) - (nowMin ?? 0)
            )}`}
            color={categoryById.get(nowTask.categoryId)?.color}
            barValue={
              ((nowMin ?? 0) - nowTask.startMin) /
              durationOf(nowTask.startMin, nowTask.endMin)
            }
          />
        ) : nextTask ? (
          <HighlightContent
            eyebrow={isToday ? "Up next" : "First up"}
            dotClass="bg-warn"
            title={nextTask.title}
            sub={
              isToday && nowMin != null
                ? `${fmtTime(nextTask.startMin)} · in ${fmtDur(nextTask.startMin - nowMin)}`
                : fmtRange(nextTask.startMin, nextTask.endMin)
            }
            color={categoryById.get(nextTask.categoryId)?.color}
          />
        ) : total > 0 && completed.length === total ? (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
              <Sparkles size={18} aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                Day complete
              </p>
              <p className="font-display text-base font-medium leading-tight">
                Everything is done — nicely paced.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-well text-mute">
              <Coffee size={18} aria-hidden />
            </span>
            <p className="text-sm text-soft">
              Nothing else scheduled. A clear stretch of day.
            </p>
          </div>
        )}
      </div>

      {/* Completion progress */}
      <div className="card flex items-center gap-4 p-4">
        <Ring value={progress} />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none">
            {completed.length}
            <span className="text-sm font-normal text-mute"> / {total}</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-mute">
            Completed
          </p>
          <p className="mt-1 text-xs text-soft">
            {pending.length > 0
              ? `${pending.length} to go · ${fmtDur(remainingMin)} of plans left`
              : total > 0
                ? "Nothing left on the plan"
                : "No plans yet"}
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={<Hourglass size={15} aria-hidden />}
          label="Remaining"
          value={pending.length === 0 ? "—" : fmtDur(remainingMin)}
          hint={pending.length === 0 ? "all clear" : `${pending.length} task${pending.length > 1 ? "s" : ""}`}
        />
        <Stat
          icon={<Target size={15} aria-hidden />}
          label="Focus time"
          value={focusPlanned > 0 ? fmtDur(focusPlanned) : "—"}
          hint={focusDone > 0 ? `${fmtDur(focusDone)} done` : "planned"}
        />
        <Stat
          icon={<Coffee size={15} aria-hidden />}
          label="Breaks"
          value={breakMin > 0 ? fmtDur(breakMin) : "—"}
          hint={breaks.length > 0 ? `${breaks.length} planned` : "add one?"}
        />
        <Stat
          icon={<MoonStar size={15} aria-hidden />}
          label="Sleep"
          value={sleepMin > 0 ? fmtDur(sleepMin) : "—"}
          hint="tonight"
        />
      </div>
    </div>
  );
}

function HighlightContent({
  eyebrow,
  dotClass,
  title,
  sub,
  color,
  barValue,
}: {
  eyebrow: string;
  dotClass: string;
  title: string;
  sub: string;
  color?: string;
  barValue?: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotClass}`} aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
          {eyebrow}
        </p>
      </div>
      <p className="mt-1.5 truncate font-display text-lg font-medium leading-tight">{title}</p>
      <p className="mt-0.5 text-xs text-soft">{sub}</p>
      {barValue != null && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-well" aria-hidden>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(2, barValue * 100))}%`,
              background: color ?? "var(--accent)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 text-mute">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-mute">{hint}</p>
    </div>
  );
}
