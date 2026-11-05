export type RepeatRule = { type: "once" } | { type: "weekly"; days: number[] };

export interface Task {
  id: string;
  title: string;
  /** yyyy-mm-dd anchor date (the exact day for one-time tasks) */
  date: string;
  /** minutes after midnight, 0–1439 */
  startMin: number;
  /** minutes after midnight, 0–1439. If <= startMin the task ends after midnight. */
  endMin: number;
  categoryId: string;
  notes?: string;
  repeat: RepeatRule;
  createdAt: number;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  builtin?: boolean;
  /** counts toward "focus time" in the day summary */
  focus?: boolean;
  /** breaks are excluded from focus/ongoing stats and highlighted in summary */
  isBreak?: boolean;
  isSleep?: boolean;
}

export type InstanceStatus = "completed" | "skipped" | "hidden";
/** keyed by `${taskId}|${date}` so recurring tasks track status per day */
export type StatusMap = Record<string, InstanceStatus>;
/** per-day time overrides for recurring (or moved) instances */
export type OverrideMap = Record<string, { startMin: number; endMin: number }>;

/** A task resolved for one specific date, with per-day status and overrides applied */
export interface TaskInstance extends Task {
  status?: InstanceStatus;
  /** instanceKey: `${id}|${date}` */
  key: string;
}

export interface SavePayload {
  id?: string;
  title: string;
  categoryId: string;
  date: string;
  startMin: number;
  endMin: number;
  repeat: RepeatRule;
  notes: string;
  /** when editing a recurring task: apply only to the viewed day */
  occurrenceOnly: boolean;
}
