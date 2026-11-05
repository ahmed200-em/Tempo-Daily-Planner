import type { Task, TaskInstance, StatusMap, OverrideMap } from "../types";

export const DAY = 1440;
export const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // index = JS getDay()
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function uid() {
  return (
    Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
  );
}

export function instKey(taskId: string, date: string) {
  return `${taskId}|${date}`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** minutes -> "09:30" (24h, for <input type="time">) */
export function toHHMM(min: number) {
  const m = ((min % DAY) + DAY) % DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

/** "09:30" -> minutes, or null when invalid */
export function fromHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

/** minutes -> "7:05 AM" */
export function fmtTime(min: number) {
  const m = ((min % DAY) + DAY) % DAY;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad2(m % 60)} ${h24 < 12 ? "AM" : "PM"}`;
}

export function fmtRange(s: number, e: number) {
  return `${fmtTime(s)} – ${fmtTime(e)}`;
}

export function fmtDur(mins: number) {
  const m = Math.round(mins);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

/** "6 AM" for timeline gutter labels */
export function fmtHourLabel(h: number) {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 || 12} ${hh < 12 ? "AM" : "PM"}`;
}

/* ---------------- dates ---------------- */

export function dateKeyOf(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function todayKey() {
  return dateKeyOf(new Date());
}
export function dateFromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(key: string, n: number) {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + n);
  return dateKeyOf(d);
}
export function weekdayOf(key: string) {
  return dateFromKey(key).getDay();
}
/** Monday-first week containing `key` */
export function weekDates(key: string) {
  const offset = (weekdayOf(key) + 6) % 7; // 0 = Monday
  const monday = addDays(key, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export function friendlyDate(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateFromKey(key));
}
export function shortDate(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(dateFromKey(key));
}
export function relativeDay(key: string) {
  const t = todayKey();
  if (key === t) return "Today";
  if (key === addDays(t, 1)) return "Tomorrow";
  if (key === addDays(t, -1)) return "Yesterday";
  return shortDate(key);
}

/* ---------------- intervals ---------------- */

export function isOvernight(s: number, e: number) {
  return e <= s;
}
/** wrap-aware duration in minutes */
export function durationOf(s: number, e: number) {
  return e <= s ? DAY - s + e : e - s;
}
/** end normalized so it's always > start (adds 1440 when overnight) */
export function normEnd(s: number, e: number) {
  return e <= s ? e + DAY : e;
}
export function overlap(aS: number, aE: number, bS: number, bE: number) {
  const aE2 = normEnd(aS, aE);
  const bE2 = normEnd(bS, bE);
  return aS < bE2 && bS < aE2;
}
export const ceilToSnap = (min: number, snap = 15) => Math.ceil(min / snap) * snap;

/* ---------------- schedule ---------------- */

export function occursOn(t: Task, key: string) {
  if (t.repeat.type === "once") return t.date === key;
  return t.repeat.days.length > 0 && t.repeat.days.includes(weekdayOf(key));
}

export function instancesForDate(
  tasks: Task[],
  statuses: StatusMap,
  overrides: OverrideMap,
  key: string
): TaskInstance[] {
  const out: TaskInstance[] = [];
  for (const t of tasks) {
    if (!occursOn(t, key)) continue;
    const k = instKey(t.id, key);
    const status = statuses[k];
    if (status === "hidden") continue;
    const ov = overrides[k];
    out.push({
      ...t,
      startMin: ov?.startMin ?? t.startMin,
      endMin: ov?.endMin ?? t.endMin,
      status,
      key: k,
    });
  }
  out.sort(
    (a, b) =>
      a.startMin - b.startMin ||
      normEnd(a.startMin, a.endMin) - normEnd(b.startMin, b.endMin) ||
      a.createdAt - b.createdAt
  );
  return out;
}

export function countForDate(tasks: Task[], statuses: StatusMap, key: string) {
  let n = 0;
  for (const t of tasks) {
    if (!occursOn(t, key)) continue;
    if (statuses[instKey(t.id, key)] === "hidden") continue;
    n++;
  }
  return n;
}

export function findConflicts(
  insts: TaskInstance[],
  cand: { id?: string; startMin: number; endMin: number }
) {
  return insts.filter(
    (i) =>
      i.id !== cand.id &&
      overlap(cand.startMin, cand.endMin, i.startMin, i.endMin)
  );
}

/** ids of instances that overlap at least one other instance */
export function conflictIds(insts: TaskInstance[]) {
  const ids = new Set<string>();
  for (let i = 0; i < insts.length; i++) {
    for (let j = i + 1; j < insts.length; j++) {
      const a = insts[i];
      const b = insts[j];
      if (overlap(a.startMin, a.endMin, b.startMin, b.endMin)) {
        ids.add(a.key);
        ids.add(b.key);
      }
    }
  }
  return ids;
}

export interface Placement<T> {
  item: T;
  col: number;
  cols: number;
}

/** Calendar-style column layout for overlapping intervals */
export function layoutDay<T extends { startMin: number; endMin: number }>(
  items: T[]
): Placement<T>[] {
  const norm = items
    .map((t) => ({ t, s: t.startMin, e: normEnd(t.startMin, t.endMin) }))
    .sort((a, b) => a.s - b.s || a.e - b.e);
  const res: Placement<T>[] = [];
  let cluster: typeof norm = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const placed: Placement<T>[] = [];
    for (const c of cluster) {
      let col = colEnds.findIndex((end) => end <= c.s);
      if (col === -1) {
        colEnds.push(c.e);
        col = colEnds.length - 1;
      } else {
        colEnds[col] = c.e;
      }
      placed.push({ item: c.t, col, cols: 0 });
    }
    const cols = colEnds.length;
    placed.forEach((p) => res.push({ ...p, cols }));
    cluster = [];
    clusterEnd = -1;
  };

  for (const c of norm) {
    if (cluster.length && c.s >= clusterEnd) flush();
    cluster.push(c);
    clusterEnd = Math.max(clusterEnd, c.e);
  }
  flush();
  return res;
}

export interface DayCoverage {
  /** minutes claimed per category id (each minute counted once) */
  perCategory: Map<string, number>;
  /** minutes with nothing scheduled */
  free: number;
  /** minutes with something scheduled */
  planned: number;
  /** open stretches of at least `minRun` minutes */
  gaps: { start: number; end: number; length: number }[];
}

/**
 * Paint the 24h day minute-by-minute so overlapping tasks are never
 * double-counted, then report category totals and the open stretches.
 */
export function dayCoverage(
  items: { startMin: number; endMin: number; categoryId: string }[],
  opts: { from?: number; minRun?: number } = {}
): DayCoverage {
  const from = opts.from ?? 0;
  const minRun = opts.minRun ?? 30;
  const paint: (string | null)[] = new Array(DAY).fill(null);

  for (const it of items) {
    const end = Math.min(normEnd(it.startMin, it.endMin), DAY);
    for (let m = Math.max(0, it.startMin); m < end; m++) {
      if (paint[m] == null) paint[m] = it.categoryId;
    }
  }

  const perCategory = new Map<string, number>();
  let planned = 0;
  for (let m = 0; m < DAY; m++) {
    const c = paint[m];
    if (c == null) continue;
    planned++;
    perCategory.set(c, (perCategory.get(c) ?? 0) + 1);
  }

  const gaps: { start: number; end: number; length: number }[] = [];
  let run = -1;
  for (let m = Math.max(0, from); m <= DAY; m++) {
    const open = m < DAY && paint[m] == null;
    if (open && run === -1) run = m;
    if (!open && run !== -1) {
      const len = m - run;
      if (len >= minRun) gaps.push({ start: run, end: m, length: len });
      run = -1;
    }
  }

  return { perCategory, free: DAY - planned, planned, gaps };
}

/** earliest free start >= `from` (snapped to 15m) that fits `dur` before midnight */
export function nextFreeSlot(
  insts: { id: string; startMin: number; endMin: number }[],
  from: number,
  dur: number,
  ignoreId?: string
): number | null {
  let s = ceilToSnap(from);
  for (; s + dur <= DAY; s += 15) {
    const e = s + dur;
    const hit = insts.some(
      (i) => i.id !== ignoreId && overlap(s, e, i.startMin, i.endMin)
    );
    if (!hit) return s;
  }
  return null;
}
