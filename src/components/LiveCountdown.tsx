import { useEffect, useState } from "react";
import { CalendarDays, CheckCheck, Hourglass, Timer } from "lucide-react";
import type { Category, TaskInstance } from "../types";
import { durationOf, fmtDur, fmtTime, normEnd } from "../lib/time";

interface LiveCountdownProps {
  instances: TaskInstance[];
  categoryById: Map<string, Category>;
  isToday: boolean;
  onOpen: (inst: TaskInstance) => void;
}

/** seconds since midnight, refreshed every second */
function useSecondsNow(active: boolean) {
  const [sec, setSec] = useState(() => secOfDay());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSec(secOfDay()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return sec;
}
function secOfDay() {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/** 3725 -> "1:02:05", 125 -> "2:05" */
function clock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(ss)}` : `${m}:${p(ss)}`;
}

export function LiveCountdown({
  instances,
  categoryById,
  isToday,
  onOpen,
}: LiveCountdownProps) {
  const sec = useSecondsNow(isToday);

  if (!isToday) {
    const planned = instances.filter((i) => !i.status);
    const mins = planned.reduce((a, i) => a + durationOf(i.startMin, i.endMin), 0);
    return (
      <Shell eyebrow="Another day" icon={<CalendarDays size={13} aria-hidden />}>
        <p className="font-display text-3xl font-semibold leading-none tabular-nums">
          {planned.length}
        </p>
        <p className="mt-1.5 text-xs text-soft">
          {planned.length === 1 ? "task planned" : "tasks planned"}
          {mins > 0 && ` · ${fmtDur(mins)} total`}
        </p>
      </Shell>
    );
  }

  const open = instances.filter((i) => !i.status);
  const running = open.find((i) => {
    const s = i.startMin * 60;
    const e = normEnd(i.startMin, i.endMin) * 60;
    return sec >= s && sec < e;
  });

  if (running) {
    const cat = categoryById.get(running.categoryId);
    const color = cat?.color ?? "var(--accent)";
    const startSec = running.startMin * 60;
    const endSec = normEnd(running.startMin, running.endMin) * 60;
    const left = endSec - sec;
    const pct = Math.min(1, Math.max(0, (sec - startSec) / (endSec - startSec)));
    const isBreak = !!cat?.isBreak;

    return (
      <Shell
        eyebrow={isBreak ? "Break ends in" : "Time remaining"}
        icon={<Timer size={13} aria-hidden />}
        accent={color}
        pulse
      >
        <p
          className="font-display text-[2.6rem] font-semibold leading-none tabular-nums"
          style={{ color }}
          aria-live="off"
        >
          {clock(left)}
        </p>
        <p className="sr-only" aria-live="polite">
          {fmtDur(Math.ceil(left / 60))} remaining on {running.title}
        </p>
        <button
          onClick={() => onOpen(running)}
          className="mt-2 block w-full truncate text-left text-sm font-semibold hover:underline"
          title={running.title}
        >
          {running.title}
        </button>
        <p className="mt-0.5 text-[11px] tabular-nums text-mute">
          ends {fmtTime(running.endMin)} · {Math.round(pct * 100)}% through
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-well" aria-hidden>
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(2, pct * 100)}%`, background: color }}
          />
        </div>
      </Shell>
    );
  }

  const next = open
    .filter((i) => i.startMin * 60 > sec)
    .sort((a, b) => a.startMin - b.startMin)[0];

  if (next) {
    const cat = categoryById.get(next.categoryId);
    const color = cat?.color ?? "var(--accent)";
    const left = next.startMin * 60 - sec;
    return (
      <Shell eyebrow="Starts in" icon={<Hourglass size={13} aria-hidden />} accent={color}>
        <p className="font-display text-[2.6rem] font-semibold leading-none tabular-nums">
          {clock(left)}
        </p>
        <button
          onClick={() => onOpen(next)}
          className="mt-2 block w-full truncate text-left text-sm font-semibold hover:underline"
          title={next.title}
        >
          {next.title}
        </button>
        <p className="mt-0.5 text-[11px] tabular-nums text-mute">
          at {fmtTime(next.startMin)} · {fmtDur(durationOf(next.startMin, next.endMin))} planned
        </p>
      </Shell>
    );
  }

  const doneCount = instances.filter((i) => i.status === "completed").length;
  return (
    <Shell eyebrow="Day's clock" icon={<CheckCheck size={13} aria-hidden />}>
      <p className="font-display text-3xl font-semibold leading-none">
        {instances.length > 0 && doneCount === instances.length ? "All done" : "Free"}
      </p>
      <p className="mt-1.5 text-xs text-soft">
        {instances.length === 0
          ? "Nothing scheduled — the day is yours."
          : "No task running and nothing left today."}
      </p>
    </Shell>
  );
}

function Shell({
  eyebrow,
  icon,
  accent,
  pulse,
  children,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  accent?: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="card relative overflow-hidden p-4"
      aria-label="Live countdown"
      style={
        accent
          ? { borderColor: `color-mix(in srgb, ${accent} 32%, var(--line))` }
          : undefined
      }
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: accent }}
        />
      )}
      <div className="mb-2 flex items-center gap-1.5 text-mute">
        {pulse && (
          <span
            className="size-1.5 animate-pulse rounded-full"
            style={{ background: accent ?? "var(--accent)" }}
            aria-hidden
          />
        )}
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{eyebrow}</p>
      </div>
      {children}
    </section>
  );
}
