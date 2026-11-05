import { Fragment, useMemo } from "react";
import {
  Flame,
  Minus,
  SkipForward,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Category, OverrideMap, StatusMap, Task } from "../types";
import { computeWeekStats, type DayStat, type WeekStats } from "../lib/stats";
import { dateFromKey, fmtDur, fmtRange, shortDate, todayKey, weekDates } from "../lib/time";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export function useWeekStats(
  tasks: Task[],
  statuses: StatusMap,
  overrides: OverrideMap,
  categories: Category[],
  dateKey: string,
  nowMin: number
): WeekStats {
  return useMemo(
    () =>
      computeWeekStats(
        tasks,
        statuses,
        overrides,
        weekDates(dateKey),
        categories,
        todayKey(),
        nowMin
      ),
    [tasks, statuses, overrides, categories, dateKey, nowMin]
  );
}

/* ---------------- compact sidebar card ---------------- */

export function WeekProgressCard({
  stats,
  onOpen,
}: {
  stats: WeekStats;
  onOpen: () => void;
}) {
  const max = Math.max(1, ...stats.days.map((d) => d.total));
  const notDone = stats.skipped + stats.missed;
  return (
    <button
      onClick={onOpen}
      className="card w-full p-4 text-left transition-colors hover:border-accent/50"
      aria-label={`This week Report ${stats.completed} done${
        notDone > 0 ? ` ${notDone} not done` : ""
      } M T W T F S S. Open the full weekly report.`}
    >
      <div className="flex items-center gap-1.5 text-mute">
        <TrendingUp size={13} aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">This week</p>{" "}
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-accent">
          Report
        </span>
      </div>{" "}
      <div className="mt-2 flex items-baseline gap-1.5">
        <p className="font-display text-2xl font-semibold leading-none tabular-nums">
          {stats.completed}
        </p>{" "}
        <p className="text-xs text-soft">done</p>{" "}
        {stats.skipped + stats.missed > 0 && (
          <p className="ml-auto text-xs font-semibold tabular-nums text-mute">
            {stats.skipped + stats.missed} not done
          </p>
        )}
      </div>{" "}
      <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden>
        {stats.days.map((d) => (
          <DayBar key={d.key} day={d} max={max} />
        ))}
      </div>{" "}
      <div className="mt-1 flex gap-1.5" aria-hidden>
        {stats.days.map((d, i) => (
          <Fragment key={d.key}>
            {i > 0 ? " " : null}
            <span className="flex-1 text-center text-[9px] font-bold text-mute">
              {DOW[i]}
            </span>
          </Fragment>
        ))}
      </div>
    </button>
  );
}

function DayBar({ day, max }: { day: DayStat; max: number }) {
  const h = (n: number) => `${(n / max) * 100}%`;
  const isToday = day.key === todayKey();
  return (
    <div
      className={`flex h-full flex-1 flex-col justify-end gap-px rounded-sm ${
        isToday ? "ring-1 ring-accent/50" : ""
      }`}
      title={`${shortDate(day.key)} — ${day.completed} done, ${day.skipped} skipped, ${day.missed} missed`}
    >
      {day.upcoming > 0 && (
        <span className="w-full rounded-t-sm bg-line" style={{ height: h(day.upcoming) }} />
      )}
      {day.missed > 0 && (
        <span className="w-full bg-danger/55" style={{ height: h(day.missed) }} />
      )}
      {day.skipped > 0 && (
        <span className="w-full bg-warn/55" style={{ height: h(day.skipped) }} />
      )}
      {day.completed > 0 && (
        <span className="w-full rounded-b-sm bg-accent" style={{ height: h(day.completed) }} />
      )}
      {day.total === 0 && <span className="h-[3px] w-full rounded-sm bg-line/60" />}
    </div>
  );
}

/* ---------------- full report body (rendered as a page) ---------------- */

interface ReportBodyProps {
  stats: WeekStats;
  onGoToDay: (key: string) => void;
}

export function ReportBody({ stats, onGoToDay }: ReportBodyProps) {
  const max = Math.max(1, ...stats.days.map((d) => d.total));
  const maxFocus = Math.max(1, ...stats.days.map((d) => d.focusDone));
  const notDoneTotal = stats.skipped + stats.missed;

  return (
    <>
      <div className="space-y-6">
        {/* headline */}
        <section className="flex flex-wrap items-center gap-5">
          <RateRing rate={stats.rate} />
          <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
            <Figure label="Done" value={stats.completed} tone="accent" />
            <Figure label="Skipped" value={stats.skipped} tone="warn" />
            <Figure label="Missed" value={stats.missed} tone="danger" />
            <Figure label="Upcoming" value={stats.upcoming} tone="mute" />
          </div>
        </section>

        {/* highlight chips */}
        <section className="flex flex-wrap gap-2">
          <Chip
            icon={<Target size={12} aria-hidden />}
            text={`${fmtDur(stats.focusDone)} focus completed`}
          />
          <Chip
            icon={<Sparkles size={12} aria-hidden />}
            text={`${fmtDur(stats.minutesDone)} of plans finished`}
          />
          {stats.streak > 0 && (
            <Chip
              icon={<Flame size={12} aria-hidden />}
              text={`${stats.streak}-day streak`}
              highlight
            />
          )}
          {stats.bestDay && stats.bestDay.completed > 0 && (
            <Chip
              icon={<TrendingUp size={12} aria-hidden />}
              text={`Best day: ${new Intl.DateTimeFormat("en-US", {
                weekday: "long",
              }).format(dateFromKey(stats.bestDay.key))} (${stats.bestDay.completed})`}
            />
          )}
        </section>

        {/* per-day chart */}
        <section>
          <SectionTitle>Tasks by day</SectionTitle>
          <div className="card mt-2 p-4">
            <div className="flex h-36 items-end gap-2">
              {stats.days.map((d) => (
                <button
                  key={d.key}
                  onClick={() => onGoToDay(d.key)}
                  className="flex h-full flex-1 flex-col justify-end gap-1 rounded-md transition-opacity hover:opacity-80"
                  aria-label={`Go to ${shortDate(d.key)} — ${d.total} tasks: ${d.completed} done, ${d.skipped} skipped, ${d.missed} missed, ${d.upcoming} upcoming`}
                >
                  <span className="text-center text-[10px] font-bold tabular-nums text-soft">
                    {d.total || ""}
                  </span>
                  <span className="flex w-full flex-1 flex-col justify-end gap-px">
                    {d.upcoming > 0 && (
                      <span
                        className="w-full rounded-t-md bg-line"
                        style={{ height: `${(d.upcoming / max) * 100}%` }}
                      />
                    )}
                    {d.missed > 0 && (
                      <span
                        className="w-full bg-danger/55"
                        style={{ height: `${(d.missed / max) * 100}%` }}
                      />
                    )}
                    {d.skipped > 0 && (
                      <span
                        className="w-full bg-warn/60"
                        style={{ height: `${(d.skipped / max) * 100}%` }}
                      />
                    )}
                    {d.completed > 0 && (
                      <span
                        className="w-full rounded-b-md bg-accent"
                        style={{ height: `${(d.completed / max) * 100}%` }}
                      />
                    )}
                    {d.total === 0 && <span className="h-1 w-full rounded bg-line/60" />}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2 border-t border-line pt-2">
              {stats.days.map((d, i) => (
                <span
                  key={d.key}
                  className={`flex-1 text-center text-[10px] font-bold ${
                    d.key === todayKey() ? "text-accent" : "text-mute"
                  }`}
                >
                  {DOW[i]}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              <Legend className="bg-accent" label="Done" />
              <Legend className="bg-warn/60" label="Skipped" />
              <Legend className="bg-danger/55" label="Missed" />
              <Legend className="bg-line" label="Upcoming" />
            </div>
          </div>
        </section>

        {/* focus trend */}
        {stats.focusDone > 0 && (
          <section>
            <SectionTitle>Focus time completed</SectionTitle>
            <div className="card mt-2 space-y-2 p-4">
              {stats.days.map((d, i) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-[11px] font-bold text-mute">{DOW[i]}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-well">
                    <span
                      className="block h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${(d.focusDone / maxFocus) * 100}%` }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-[11px] font-semibold tabular-nums text-soft">
                    {d.focusDone > 0 ? fmtDur(d.focusDone) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* category breakdown */}
        {stats.byCategory.length > 0 && (
          <section>
            <SectionTitle>Where your time went</SectionTitle>
            <div className="card mt-2 space-y-2.5 p-4">
              {stats.byCategory.map(({ category, minutes, count }) => (
                <div key={category.id} className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: category.color }}
                    aria-hidden
                  />
                  <span className="w-20 shrink-0 truncate text-xs font-semibold">
                    {category.label}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-well">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(minutes / stats.byCategory[0].minutes) * 100}%`,
                        background: category.color,
                      }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-soft">
                    {fmtDur(minutes)}
                    <span className="text-mute"> · {count}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* didn't happen */}
        <section>
          <SectionTitle>
            Didn&apos;t happen {notDoneTotal > 0 && `(${notDoneTotal})`}
          </SectionTitle>
          {notDoneTotal === 0 ? (
            <div className="card mt-2 flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                <Sparkles size={16} aria-hidden />
              </span>
              <p className="text-sm text-soft">
                Nothing was skipped or missed this week. That&apos;s a clean sheet.
              </p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {stats.notDone.slice(0, 12).map((item) => (
                <li key={`${item.inst.key}-${item.outcome}`}>
                  <button
                    onClick={() => onGoToDay(item.date)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-well/40 px-3 py-2 text-left transition-colors hover:border-accent/40"
                  >
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full ${
                        item.outcome === "skipped"
                          ? "bg-warn/15 text-warn"
                          : "bg-danger/12 text-danger"
                      }`}
                      aria-hidden
                    >
                      {item.outcome === "skipped" ? (
                        <SkipForward size={12} />
                      ) : (
                        <Minus size={12} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {item.inst.title}
                      </span>
                      <span className="block text-[11px] tabular-nums text-mute">
                        {shortDate(item.date)} · {fmtRange(item.inst.startMin, item.inst.endMin)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
                        item.outcome === "skipped" ? "text-warn" : "text-danger"
                      }`}
                    >
                      {item.outcome}
                    </span>
                  </button>
                </li>
              ))}
              {stats.notDone.length > 12 && (
                <li className="pt-1 text-center text-[11px] text-mute">
                  +{stats.notDone.length - 12} more
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">{children}</h2>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-mute">
      <span className={`size-2 rounded-sm ${className}`} aria-hidden />
      {label}
    </span>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "warn" | "danger" | "mute";
}) {
  const colors = {
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger",
    mute: "text-soft",
  };
  return (
    <div>
      <p className={`font-display text-2xl font-semibold leading-none tabular-nums ${colors[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-mute">{label}</p>
    </div>
  );
}

function Chip({
  icon,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        highlight
          ? "border-warn/40 bg-warn/10 text-warn"
          : "border-line bg-well/50 text-soft"
      }`}
    >
      {icon}
      {text}
    </span>
  );
}

function RateRing({ rate }: { rate: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[88px] shrink-0 place-items-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" strokeWidth="8" className="stroke-line" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-accent transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, rate)))}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-xl font-semibold leading-none tabular-nums">
          {Math.round(rate * 100)}%
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-mute">done</p>
      </div>
    </div>
  );
}
