import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownToDot,
  Check,
  GripHorizontal,
  SkipForward,
  StickyNote,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Category, TaskInstance } from "../types";
import { DAY, durationOf, fmtDur, fmtRange, normEnd } from "../lib/time";

export interface MoveRequest {
  inst: TaskInstance;
  newStart: number;
}

interface TaskBlockProps {
  inst: TaskInstance;
  category?: Category;
  top: number;
  height: number;
  col: number;
  cols: number;
  hourPx: number;
  isNow: boolean;
  hasConflict: boolean;
  dimmed: boolean;
  nowMin: number | null;
  onEdit: (inst: TaskInstance) => void;
  onToggleStatus: (inst: TaskInstance, s: "completed" | "skipped") => void;
  onDelete: (inst: TaskInstance) => void;
  onAutoMove: (inst: TaskInstance) => void;
  onMoveRequest: (req: MoveRequest) => void;
}

export function TaskBlock({
  inst,
  category,
  top,
  height,
  col,
  cols,
  hourPx,
  isNow,
  hasConflict,
  dimmed,
  nowMin,
  onEdit,
  onToggleStatus,
  onDelete,
  onAutoMove,
  onMoveRequest,
}: TaskBlockProps) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const suppressClick = useRef(false);
  const dragData = useRef<{ cur: number; active: boolean } | null>(null);

  const done = inst.status === "completed";
  const skipped = inst.status === "skipped";
  const dur = durationOf(inst.startMin, inst.endMin);
  const compact = height < 56;
  const overnight = inst.endMin <= inst.startMin;
  const shownStart = dragStart ?? inst.startMin;
  const shownEnd = dragStart != null ? (dragStart + dur) % DAY : inst.endMin;

  // live countdowns (only while viewing today)
  const running =
    nowMin != null &&
    !done &&
    !skipped &&
    nowMin >= inst.startMin &&
    nowMin < normEnd(inst.startMin, inst.endMin);
  const runningLeft = running ? normEnd(inst.startMin, inst.endMin) - nowMin : null;
  const startsIn =
    nowMin != null && !done && !skipped && nowMin < inst.startMin
      ? inst.startMin - nowMin
      : null;
  const elapsedPct = running ? Math.min(1, Math.max(0.02, (nowMin - inst.startMin) / dur)) : 0;

  /* The accessible name has to contain the visible text verbatim (WCAG 2.5.3),
     so it follows the same order as the rendered block instead of using commas. */
  const statusWord = done ? "Done" : skipped ? "Skipped" : hasConflict ? "Overlap" : "";
  const ariaLabel = compact
    ? `${inst.title}${
        runningLeft != null ? ` ${fmtDur(runningLeft)} left` : ""
      } ${fmtRange(shownStart, shownEnd)}. Press Enter to edit.`
    : `${inst.title} ${fmtRange(shownStart, shownEnd)}${overnight ? " +1 day" : ""} ${fmtDur(
        dur
      )}${
        runningLeft != null
          ? ` ${fmtDur(runningLeft)} left`
          : startsIn != null && startsIn <= 180
            ? ` starts in ${fmtDur(startsIn)}`
            : ""
      }${statusWord ? ` ${statusWord}` : ""}. Press Enter to edit.`;

  const beginDrag = (e: React.PointerEvent, fromHandle: boolean) => {
    if (e.button !== 0) return;
    if (!fromHandle && e.pointerType !== "mouse") return; // touch drags start from the handle
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const startY = e.clientY;
    const orig = inst.startMin;
    dragData.current = { cur: orig, active: false };

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const d = dragData.current;
      if (!d) return;
      if (!d.active && Math.abs(dy) < 5) return;
      if (!d.active) {
        d.active = true;
        suppressClick.current = true;
      }
      const deltaMin = Math.round((dy / hourPx) * 60 / 15) * 15;
      const next = Math.min(Math.max(orig + deltaMin, 0), DAY - 15);
      d.cur = next;
      setDragStart(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const d = dragData.current;
      dragData.current = null;
      setDragStart(null);
      if (d?.active && d.cur !== orig) {
        onMoveRequest({ inst, newStart: d.cur });
      }
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 50);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const leftPct = (col / cols) * 100;
  const widthPct = 100 / cols;
  const animTop =
    dragStart != null ? top + ((dragStart - inst.startMin) / 60) * hourPx : top;

  return (
    <motion.article
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-disabled={dragStart != null}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, top: animTop, height }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34, opacity: { duration: 0.2 } }}
      className={`task-block group ${done ? "is-done" : ""} ${skipped ? "is-skipped" : ""} ${
        isNow && !done && !skipped ? "is-now" : ""
      } ${dimmed ? "is-dimmed" : ""} ${dragStart != null ? "is-dragging" : ""}`}
      style={{
        ["--cat" as string]: category?.color ?? "#8d8578",
        left: `calc(${leftPct}% + 3px)`,
        width: `calc(${widthPct}% - 6px)`,
        zIndex: dragStart != null ? 40 : undefined,
      }}
      onClick={() => {
        if (!suppressClick.current) onEdit(inst);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(inst);
        }
      }}
      onPointerDown={(e) => beginDrag(e, false)}
    >
      {/* category accent bar */}
      <span
        aria-hidden
        className="absolute inset-y-1.5 left-1.5 w-[3px] rounded-full"
        style={{ background: "var(--cat)" }}
      />

      <div className={`flex h-full flex-col ${compact ? "justify-center px-3 pl-4" : "px-3 pb-2 pl-4 pt-2"}`}>
        {compact ? (
          <div className="flex items-baseline gap-2 pr-1">
            <p
              className={`min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug ${
                done ? "line-through decoration-[1.5px]" : ""
              }`}
            >
              {inst.title}
            </p>{" "}
            {runningLeft != null && (
              <p className="shrink-0 text-[11px] font-bold tabular-nums text-ink">
                {fmtDur(runningLeft)} left
              </p>
            )}{" "}
            <p className="shrink-0 text-[11px] font-medium tabular-nums text-soft">
              {fmtRange(shownStart, shownEnd)}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-1.5 pr-1">
              <p
                className={`min-w-0 flex-1 text-[13.5px] font-semibold leading-snug ${
                  done ? "line-through decoration-[1.5px]" : ""
                }`}
                style={{ overflowWrap: "anywhere" }}
              >
                {inst.title}
              </p>
            </div>{" "}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium tabular-nums text-soft">
              <span>{fmtRange(shownStart, shownEnd)}</span>{" "}
              {overnight && (
                <span className="rounded bg-well px-1 py-px text-[9px] font-bold uppercase tracking-wide text-mute">
                  +1 day
                </span>
              )}{" "}
              <span className="text-mute">{fmtDur(dur)}</span>{" "}
              {runningLeft != null && (
                <span className="inline-flex items-center gap-1 font-bold text-ink" aria-live="polite">
                  <span className="size-1.5 animate-pulse rounded-full" style={{ background: "var(--cat)" }} aria-hidden />
                  {fmtDur(runningLeft)} left
                </span>
              )}{" "}
              {runningLeft == null && startsIn != null && startsIn <= 180 && (
                <span className="text-mute">starts in {fmtDur(startsIn)}</span>
              )}
              {inst.notes && <StickyNote size={11} className="text-mute" aria-label="Has notes" />}
            </div>{" "}
            {(done || skipped || hasConflict) && (
              <div className="mt-1 flex items-center gap-1.5">
                {done && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-accent">
                    <Check size={10} aria-hidden /> Done
                  </span>
                )}
                {skipped && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-well px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-mute">
                    <SkipForward size={10} aria-hidden /> Skipped
                  </span>
                )}
                {hasConflict && !done && !skipped && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warn/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-warn">
                    <AlertTriangle size={10} aria-hidden /> Overlap
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* drag handle for touch devices */}
        <span
          role="button"
          aria-label={`Drag to reschedule ${inst.title}`}
          title="Drag to reschedule"
          className="drag-handle coarse-only absolute bottom-0.5 left-1/2 hidden -translate-x-1/2 items-center justify-center rounded-full px-3 py-0.5 text-mute"
          onPointerDown={(e) => beginDrag(e, true)}
        >
          <GripHorizontal size={15} />
        </span>
      </div>

      {/* quick actions */}
      <div
        className="absolute right-1 top-1 flex gap-0.5 rounded-lg border border-line/70 bg-panel/90 p-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <QuickAction
          label={done ? "Mark as not done" : "Mark complete"}
          onClick={() => onToggleStatus(inst, "completed")}
        >
          {done ? <Undo2 size={13} /> : <Check size={13} />}
        </QuickAction>
        <QuickAction
          label={skipped ? "Unskip" : "Skip for today"}
          onClick={() => onToggleStatus(inst, "skipped")}
        >
          {skipped ? <Undo2 size={13} /> : <SkipForward size={13} />}
        </QuickAction>
        <QuickAction label="Move to next free slot" onClick={() => onAutoMove(inst)}>
          <ArrowDownToDot size={13} />
        </QuickAction>
        <QuickAction label="Delete" danger onClick={() => onDelete(inst)}>
          <Trash2 size={13} />
        </QuickAction>
      </div>

      {/* live time bubble while dragging */}
      {dragStart != null && (
        <div className="pointer-events-none absolute left-2 top-1.5 z-50 whitespace-nowrap rounded-md bg-ink/95 px-2 py-1 text-[11px] font-semibold tabular-nums text-paper shadow-md">
          {fmtRange(shownStart, shownEnd)}
        </div>
      )}

      {/* elapsed-time progress bar while the task is running */}
      {running && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: "color-mix(in srgb, var(--cat) 18%, transparent)" }}
        >
          <span
            className="block h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${elapsedPct * 100}%`, background: "var(--cat)" }}
          />
        </span>
      )}
    </motion.article>
  );
}

function QuickAction({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-6 place-items-center rounded-md transition-colors ${
        danger
          ? "text-mute hover:bg-danger/12 hover:text-danger"
          : "text-soft hover:bg-accent/12 hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
