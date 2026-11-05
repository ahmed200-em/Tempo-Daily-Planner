import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Repeat, SkipForward, Trash2, Undo2, X } from "lucide-react";
import type { Category, SavePayload, TaskInstance } from "../types";
import {
  DAY,
  durationOf,
  fmtRange,
  fmtTime,
  fromHHMM,
  shortDate,
  toHHMM,
  uid,
  WEEKDAY_LETTERS,
  weekdayOf,
} from "../lib/time";
import { CUSTOM_COLORS } from "../data/defaults";
import { Modal } from "./Modal";

export interface TaskPreset {
  title?: string;
  categoryId?: string;
  startMin?: number;
  durationMin?: number;
}

interface TaskModalProps {
  open: boolean;
  mode: "create" | "edit";
  viewDate: string;
  initial?: TaskInstance | null;
  preset?: TaskPreset | null;
  categories: Category[];
  anchorOptions: TaskInstance[];
  nowMin: number | null;
  onClose: () => void;
  onSave: (p: SavePayload) => void;
  onDelete: (inst: TaskInstance, scope: "this" | "all") => void;
  onToggleStatus: (inst: TaskInstance, s: "completed" | "skipped") => void;
  onCreateCategory: (input: { label: string; color: string; focus: boolean }) => Category;
}

const DURATIONS = [15, 30, 45, 60, 90, 120, 180];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday-first pills

export function TaskModal(props: TaskModalProps) {
  const { open, mode, initial, preset, categories, viewDate } = props;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [date, setDate] = useState(viewDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [occurrenceOnly, setOccurrenceOnly] = useState(false);
  const [anchor, setAnchor] = useState("custom");
  const [error, setError] = useState<string | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  /* ---------- initialise whenever the modal opens ---------- */
  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowNewCat(false);
    setConfirmDel(false);
    setAnchor("custom");
    setOccurrenceOnly(false);

    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setCategoryId(initial.categoryId);
      setRepeatWeekly(initial.repeat.type === "weekly");
      setDays(initial.repeat.type === "weekly" ? [...initial.repeat.days] : [weekdayOf(viewDate)]);
      setDate(initial.date);
      setStart(toHHMM(initial.startMin));
      setEnd(toHHMM(initial.endMin));
      setNotes(initial.notes ?? "");
    } else {
      const startMin =
        preset?.startMin ??
        (props.nowMin != null && props.nowMin < 22 * 60
          ? Math.min(Math.ceil((props.nowMin + 15) / 30) * 30, DAY - 30)
          : 9 * 60);
      const dur = preset?.durationMin ?? 60;
      setTitle(preset?.title ?? "");
      setCategoryId(preset?.categoryId ?? categories[0]?.id ?? "");
      setRepeatWeekly(false);
      setDays([weekdayOf(props.viewDate)]);
      setDate(props.viewDate);
      setStart(toHHMM(startMin));
      setEnd(toHHMM((startMin + dur) % DAY));
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startMin = fromHHMM(start);
  const endMin = fromHHMM(end);
  const dur =
    startMin != null && endMin != null ? durationOf(startMin, endMin) : null;
  const overnight = startMin != null && endMin != null && endMin <= startMin;

  const category = categories.find((c) => c.id === categoryId);
  const isBreak = !!category?.isBreak;
  const isWeeklyEdit = mode === "edit" && initial?.repeat.type === "weekly";
  const locked = isWeeklyEdit && occurrenceOnly;

  const sortedAnchors = useMemo(
    () =>
      props.anchorOptions
        .filter((a) => a.id !== initial?.id)
        .slice()
        .sort((a, b) => a.startMin - b.startMin),
    [props.anchorOptions, initial?.id]
  );

  const daysHint = useMemo(() => {
    if (!repeatWeekly || days.length === 0) return "";
    if (days.length === 7) return "Repeats every day";
    const s = [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
    return "Repeats " + s.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ");
  }, [days, repeatWeekly]);

  function applyAnchor(key: string) {
    setAnchor(key);
    if (key === "custom" || startMin == null) return;
    const a = sortedAnchors.find((x) => x.key === key);
    if (!a) return;
    const d = dur && dur > 0 ? dur : 15;
    setStart(toHHMM(a.endMin));
    setEnd(toHHMM((a.endMin + d) % DAY));
  }

  function pickDuration(d: number) {
    if (startMin == null) return;
    setEnd(toHHMM((startMin + d) % DAY));
  }

  function validate(): SavePayload | null {
    const t = title.trim();
    if (!t) return fail("Give this task a title.");
    if (startMin == null || endMin == null) return fail("Enter a valid start and end time.");
    if (startMin === endMin) return fail("A task can't start and end at the same time.");
    if (durationOf(startMin, endMin) > 23 * 60 + 45)
      return fail("Tasks can be at most 23h 45m long.");
    if (!categoryId) return fail("Pick a category.");
    if (repeatWeekly && days.length === 0)
      return fail("Choose at least one day for the routine.");
    return {
      id: mode === "edit" ? initial!.id : undefined,
      title: t,
      categoryId,
      date,
      startMin,
      endMin,
      repeat: repeatWeekly ? { type: "weekly", days: [...days].sort() } : { type: "once" },
      notes: notes.trim(),
      occurrenceOnly: locked,
    };
  }
  function fail(msg: string): null {
    setError(msg);
    return null;
  }

  const inputCls = "field";

  return (
    <Modal open={open} onClose={props.onClose} labelledBy="task-modal-title" maxWidth="sm:max-w-xl">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 id="task-modal-title" className="font-display text-xl font-semibold">
            {mode === "edit" ? "Edit task" : isBreak ? "Add a break" : "New task"}
          </h2>
          <p className="mt-0.5 text-xs text-mute">
            {mode === "edit" && initial
              ? `${fmtRange(initial.startMin, initial.endMin)} · ${shortDate(viewDate)}`
              : `Planning for ${shortDate(date)}`}
          </p>
        </div>
        <button onClick={props.onClose} className="icon-btn !size-8" aria-label="Close dialog">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* series scope for recurring edits */}
        {isWeeklyEdit && (
          <div>
            <span className="label">Apply changes to</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-well p-1" role="group">
              {([
                ["occ", `Only ${shortDate(viewDate)}`],
                ["all", "Entire routine"],
              ] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setOccurrenceOnly(v === "occ")}
                  aria-pressed={(v === "occ") === occurrenceOnly}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                    (v === "occ") === occurrenceOnly
                      ? "bg-panel text-ink shadow-sm"
                      : "text-soft hover:text-ink"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {occurrenceOnly && (
              <p className="mt-1.5 text-[11px] text-mute">
                Only the time changes for this day — the routine stays untouched.
              </p>
            )}
          </div>
        )}

        <fieldset disabled={locked} className={locked ? "space-y-5 opacity-60" : "space-y-5"}>
          {/* title */}
          <div>
            <label htmlFor="task-title" className="label">
              Title
            </label>
            <input
              id="task-title"
              autoFocus={mode === "create"}
              className={`${inputCls} !py-2.5 text-base font-medium`}
              placeholder="e.g. Read chapter 4, Gym, Call Nina…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>

          {/* category */}
          <div>
            <span className="label" id="cat-label">
              Category
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cat-label">
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active ? "text-ink" : "border-line bg-panel text-soft hover:text-ink"
                    }`}
                    style={
                      active
                        ? {
                            borderColor: `color-mix(in srgb, ${c.color} 60%, var(--line))`,
                            background: `color-mix(in srgb, ${c.color} 14%, var(--panel))`,
                            boxShadow: `0 0 0 1px color-mix(in srgb, ${c.color} 40%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                    {c.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowNewCat((s) => !s)}
                aria-expanded={showNewCat}
                className="flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-soft hover:text-ink"
              >
                <Plus size={12} aria-hidden /> New
              </button>
            </div>

            {showNewCat && (
              <NewCategoryForm
                onCancel={() => setShowNewCat(false)}
                onCreate={(input) => {
                  const c = props.onCreateCategory(input);
                  setCategoryId(c.id);
                  setShowNewCat(false);
                }}
              />
            )}
          </div>

          {/* recurrence */}
          <div>
            <span className="label" id="when-label">
              When
            </span>
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl border border-line bg-well p-1" role="group" aria-labelledby="when-label">
              {([
                [false, "One-time", "Just this date"],
                [true, "Routine", "Repeats weekly"],
              ] as const).map(([v, l, hint]) => (
                <button
                  key={l}
                  onClick={() => setRepeatWeekly(v)}
                  aria-pressed={repeatWeekly === v}
                  className={`rounded-lg px-2 py-1.5 text-left transition-all ${
                    repeatWeekly === v ? "bg-panel shadow-sm" : "hover:bg-panel/50"
                  }`}
                >
                  <span className="block text-xs font-semibold">{l}</span>
                  <span className="block text-[10px] text-mute">{hint}</span>
                </button>
              ))}
            </div>

            {repeatWeekly ? (
              <div>
                <div className="flex gap-1" role="group" aria-label="Days of the week">
                  {DAY_ORDER.map((d) => {
                    const active = days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setDays((cur) => (active ? cur.filter((x) => x !== d) : [...cur, d]))
                        }
                        aria-pressed={active}
                        aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]}
                        className={`flex size-9 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                          active
                            ? "border-accent bg-accent text-white shadow-sm dark:text-[#101410]"
                            : "border-line bg-panel text-soft hover:text-ink"
                        }`}
                      >
                        {WEEKDAY_LETTERS[d]}
                      </button>
                    );
                  })}
                </div>
                {daysHint && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-mute">
                    <Repeat size={11} aria-hidden /> {daysHint}
                  </p>
                )}
              </div>
            ) : (
              <div className="max-w-[220px]">
                <label htmlFor="task-date" className="sr-only">
                  Date
                </label>
                <input
                  id="task-date"
                  type="date"
                  className={inputCls}
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </fieldset>

        {/* time (always editable) */}
        <div>
          <span className="label">Time</span>
          {isBreak && sortedAnchors.length > 0 && (
            <div className="mb-2.5">
              <label htmlFor="break-anchor" className="sr-only">
                Place break after
              </label>
              <select
                id="break-anchor"
                className={inputCls}
                value={anchor}
                onChange={(e) => applyAnchor(e.target.value)}
              >
                <option value="custom">Pick a start time below…</option>
                {sortedAnchors.map((a) => (
                  <option key={a.key} value={a.key}>
                    After “{a.title}” · ends {fmtTime(a.endMin)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-start" className="sr-only">
                Start time
              </label>
              <input
                id="task-start"
                type="time"
                className={inputCls}
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setAnchor("custom");
                }}
              />
              <p className="mt-1 text-[11px] text-mute">Start</p>
            </div>
            <div>
              <label htmlFor="task-end" className="sr-only">
                End time
              </label>
              <input
                id="task-end"
                type="time"
                className={inputCls}
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setAnchor("custom");
                }}
              />
              <p className="mt-1 text-[11px] text-mute">End</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => pickDuration(d)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  dur === d
                    ? "border-accent bg-accent/12 text-accent"
                    : "border-line bg-panel text-soft hover:text-ink"
                }`}
              >
                {d < 60 ? `${d}m` : d % 60 === 0 ? `${d / 60}h` : `${Math.floor(d / 60)}h${d % 60}`}
              </button>
            ))}
            {dur != null && (
              <span className="ml-1 text-[11px] font-semibold tabular-nums text-mute">
                = {dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}m` : ""}` : `${dur}m`}
                {overnight && <span className="text-warn"> · ends next morning</span>}
              </span>
            )}
          </div>
        </div>

        {/* notes */}
        <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
          <label htmlFor="task-notes" className="label">
            Notes <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="task-notes"
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Anything to remember — links, gear, goals…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={280}
          />
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-4">
        {mode === "edit" && initial && !locked ? (
          confirmDel ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-danger">Delete</span>
              {initial.repeat.type === "weekly" && (
                <button
                  className="btn-ghost !px-3 !py-1.5 !text-xs"
                  onClick={() => props.onDelete(initial, "this")}
                >
                  just this day
                </button>
              )}
              <button
                className="inline-flex items-center rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white transition-colors hover:opacity-90"
                onClick={() => props.onDelete(initial, "all")}
              >
                {initial.repeat.type === "weekly" ? "entire routine" : "this task"}
              </button>
              <button className="text-xs font-semibold text-mute hover:text-ink" onClick={() => setConfirmDel(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost !border-danger/30 !text-danger hover:!bg-danger/8"
              onClick={() => setConfirmDel(true)}
            >
              <Trash2 size={14} aria-hidden /> Delete
            </button>
          )
        ) : null}
        {mode === "edit" && initial && !confirmDel && (
          <div className="flex items-center gap-1.5">
            <button
              className="btn-ghost !px-3 !py-1.5 !text-xs"
              onClick={() => {
                props.onToggleStatus(initial, "completed");
                props.onClose();
              }}
            >
              {initial.status === "completed" ? <Undo2 size={13} aria-hidden /> : <Check size={13} aria-hidden />}
              {initial.status === "completed" ? "Undo done" : "Done"}
            </button>
            <button
              className="btn-ghost !px-3 !py-1.5 !text-xs"
              onClick={() => {
                props.onToggleStatus(initial, "skipped");
                props.onClose();
              }}
            >
              {initial.status === "skipped" ? <Undo2 size={13} aria-hidden /> : <SkipForward size={13} aria-hidden />}
              {initial.status === "skipped" ? "Undo skip" : "Skip"}
            </button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost" onClick={props.onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              const p = validate();
              if (p) props.onSave(p);
            }}
          >
            {mode === "edit" ? "Save changes" : "Add to plan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- inline custom category creator ---------- */

function NewCategoryForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: { label: string; color: string; focus: boolean }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(CUSTOM_COLORS[6]);
  const [focus, setFocus] = useState(false);

  return (
    <div className="mt-2.5 space-y-2.5 rounded-xl border border-line bg-well/60 p-3">
      <div className="flex gap-2">
        <input
          className="field !py-1.5 !text-xs"
          placeholder="Category name (e.g. Music)"
          value={label}
          maxLength={20}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="New category name"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Category color">
        {CUSTOM_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-pressed={color === c}
            aria-label={`Color ${c}`}
            className={`size-6 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-panel" : "hover:scale-110"}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-soft">
        <input
          type="checkbox"
          checked={focus}
          onChange={(e) => setFocus(e.target.checked)}
          className="size-3.5 accent-[#2f6b58]"
        />
        Counts as focus time
      </label>
      <div className="flex gap-2">
        <button
          className="btn-primary !px-3 !py-1.5 !text-xs"
          disabled={!label.trim()}
          onClick={() => label.trim() && onCreate({ label: label.trim(), color, focus })}
          style={!label.trim() ? { opacity: 0.5 } : undefined}
        >
          Add category
        </button>
        <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function newCategoryFrom(input: { label: string; color: string; focus: boolean }): Category {
  return { id: `cat-${uid()}`, label: input.label, color: input.color, focus: input.focus };
}
