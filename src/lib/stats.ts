import type { Category, OverrideMap, StatusMap, Task, TaskInstance } from "../types";
import { addDays, durationOf, instancesForDate, normEnd } from "./time";

export type Outcome = "completed" | "skipped" | "missed" | "upcoming";

export interface OutcomeItem {
  inst: TaskInstance;
  date: string;
  outcome: Outcome;
}

export interface DayStat {
  key: string;
  completed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  total: number;
  focusDone: number;
  focusPlanned: number;
  minutesDone: number;
}

export interface WeekStats {
  days: DayStat[];
  completed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  total: number;
  /** completed / (completed + skipped + missed) — only days that already resolved */
  rate: number;
  focusDone: number;
  focusPlanned: number;
  minutesDone: number;
  notDone: OutcomeItem[];
  byCategory: { category: Category; minutes: number; count: number }[];
  bestDay: DayStat | null;
  perfectDays: number;
  streak: number;
}

/** Decide what actually happened to a task instance on a given date. */
export function classify(
  inst: TaskInstance,
  dayKey: string,
  todayK: string,
  nowMin: number
): Outcome {
  if (inst.status === "completed") return "completed";
  if (inst.status === "skipped") return "skipped";
  if (dayKey < todayK) return "missed";
  if (dayKey > todayK) return "upcoming";
  // today: an un-actioned task whose window already closed counts as missed
  const overnight = inst.endMin <= inst.startMin;
  if (!overnight && nowMin >= normEnd(inst.startMin, inst.endMin)) return "missed";
  return "upcoming";
}

const emptyDay = (key: string): DayStat => ({
  key,
  completed: 0,
  skipped: 0,
  missed: 0,
  upcoming: 0,
  total: 0,
  focusDone: 0,
  focusPlanned: 0,
  minutesDone: 0,
});

export function computeWeekStats(
  tasks: Task[],
  statuses: StatusMap,
  overrides: OverrideMap,
  weekKeys: string[],
  categories: Category[],
  todayK: string,
  nowMin: number
): WeekStats {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const days: DayStat[] = [];
  const notDone: OutcomeItem[] = [];
  const catMinutes = new Map<string, { minutes: number; count: number }>();

  for (const key of weekKeys) {
    const stat = emptyDay(key);
    const insts = instancesForDate(tasks, statuses, overrides, key);
    for (const inst of insts) {
      const outcome = classify(inst, key, todayK, nowMin);
      const dur = durationOf(inst.startMin, inst.endMin);
      const cat = catById.get(inst.categoryId);
      stat.total++;
      stat[outcome]++;
      if (outcome === "completed") {
        stat.minutesDone += dur;
        if (cat?.focus) stat.focusDone += dur;
        const prev = catMinutes.get(inst.categoryId) ?? { minutes: 0, count: 0 };
        catMinutes.set(inst.categoryId, {
          minutes: prev.minutes + dur,
          count: prev.count + 1,
        });
      }
      if (outcome !== "skipped" && cat?.focus) stat.focusPlanned += dur;
      if (outcome === "skipped" || outcome === "missed") {
        notDone.push({ inst, date: key, outcome });
      }
    }
    days.push(stat);
  }

  const sum = (f: (d: DayStat) => number) => days.reduce((a, d) => a + f(d), 0);
  const completed = sum((d) => d.completed);
  const skipped = sum((d) => d.skipped);
  const missed = sum((d) => d.missed);
  const upcoming = sum((d) => d.upcoming);
  const resolved = completed + skipped + missed;

  const byCategory = [...catMinutes.entries()]
    .map(([id, v]) => ({
      category:
        catById.get(id) ?? { id, label: "Removed", color: "#8d8578" },
      minutes: v.minutes,
      count: v.count,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const resolvedDays = days.filter((d) => d.total > 0 && d.key <= todayK);
  const bestDay =
    resolvedDays.length > 0
      ? resolvedDays.reduce((a, b) => (b.completed > a.completed ? b : a))
      : null;
  const perfectDays = resolvedDays.filter(
    (d) => d.completed > 0 && d.missed === 0 && d.skipped === 0 && d.upcoming === 0
  ).length;

  return {
    days,
    completed,
    skipped,
    missed,
    upcoming,
    total: completed + skipped + missed + upcoming,
    rate: resolved === 0 ? 0 : completed / resolved,
    focusDone: sum((d) => d.focusDone),
    focusPlanned: sum((d) => d.focusPlanned),
    minutesDone: sum((d) => d.minutesDone),
    notDone: notDone.sort((a, b) =>
      a.date === b.date ? a.inst.startMin - b.inst.startMin : a.date < b.date ? 1 : -1
    ),
    byCategory,
    bestDay,
    perfectDays,
    streak: computeStreak(tasks, statuses, overrides, todayK, nowMin),
  };
}

/** Consecutive days (ending today or yesterday) where every scheduled task got done. */
export function computeStreak(
  tasks: Task[],
  statuses: StatusMap,
  overrides: OverrideMap,
  todayK: string,
  nowMin: number
): number {
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const key = addDays(todayK, -i);
    const insts = instancesForDate(tasks, statuses, overrides, key);
    if (insts.length === 0) {
      if (i === 0) continue; // today may not have started yet
      break;
    }
    const outcomes = insts.map((inst) => classify(inst, key, todayK, nowMin));
    const done = outcomes.filter((o) => o === "completed").length;
    const bad = outcomes.filter((o) => o === "missed" || o === "skipped").length;
    const pending = outcomes.filter((o) => o === "upcoming").length;
    if (i === 0) {
      // today still counts while it's in progress, as long as nothing was dropped
      if (bad === 0 && done > 0) streak++;
      else if (bad > 0) break;
      continue;
    }
    if (bad === 0 && pending === 0 && done > 0) streak++;
    else break;
  }
  return streak;
}
