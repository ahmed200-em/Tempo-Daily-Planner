import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Plus, Sunrise } from "lucide-react";
import type { Category, TaskInstance } from "../types";
import {
  conflictIds,
  DAY,
  fmtHourLabel,
  fmtTime,
  layoutDay,
  normEnd,
} from "../lib/time";
import { TaskBlock, type MoveRequest } from "./TaskBlock";

interface TimelineProps {
  dateKey: string;
  instances: TaskInstance[];
  categoryById: Map<string, Category>;
  nowMin: number | null;
  isToday: boolean;
  filter: string | null;
  onSlotClick: (min: number) => void;
  onEdit: (inst: TaskInstance) => void;
  onToggleStatus: (inst: TaskInstance, s: "completed" | "skipped") => void;
  onDelete: (inst: TaskInstance) => void;
  onAutoMove: (inst: TaskInstance) => void;
  onMoveRequest: (req: MoveRequest) => void;
  onAddTask: () => void;
  onAddBreak: () => void;
}

const HOUR_PX = 64;

export function Timeline(props: TimelineProps) {
  const { instances, nowMin, isToday } = props;
  const nowRef = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string | null>(null);

  const laid = useMemo(() => layoutDay(instances), [instances]);
  const conflicts = useMemo(() => conflictIds(instances), [instances]);

  // vertical range: cover tasks (clipped to the day) plus the current hour
  const { start, end } = useMemo(() => {
    let s = 6 * 60;
    let e = 23 * 60;
    for (const i of instances) {
      s = Math.min(s, Math.floor(i.startMin / 60) * 60);
      e = Math.max(e, Math.min(normEnd(i.startMin, i.endMin), DAY));
    }
    if (isToday && nowMin != null) {
      s = Math.min(s, Math.floor(nowMin / 60) * 60);
      e = Math.max(e, Math.ceil((nowMin + 1) / 60) * 60);
    }
    e = Math.min(DAY, Math.ceil(e / 60) * 60);
    if (e <= s) e = Math.min(DAY, s + 3 * 60);
    return { start: s, end: e };
  }, [instances, isToday, nowMin]);

  const height = ((end - start) / 60) * HOUR_PX;

  // bring "now" into view once per day-change
  useEffect(() => {
    if (!isToday || scrolledFor.current === props.dateKey) return;
    const id = window.setTimeout(() => {
      nowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      scrolledFor.current = props.dateKey;
    }, 250);
    return () => window.clearTimeout(id);
  }, [props.dateKey, isToday]);

  const hours: number[] = [];
  for (let h = start / 60; h < end / 60; h++) hours.push(h);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("article")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = Math.round(((y / HOUR_PX) * 60 + start) / 30) * 30;
    props.onSlotClick(Math.min(Math.max(min, 0), DAY - 30));
  };

  const nowVisible =
    isToday && nowMin != null && nowMin >= start && nowMin <= end;

  if (instances.length === 0) {
    return <EmptyDay onAddTask={props.onAddTask} onAddBreak={props.onAddBreak} />;
  }

  return (
    <div
      className="card relative select-none overflow-hidden"
      aria-label="Daily timeline"
    >
      <div
        className="relative cursor-cell"
        style={{ height }}
        onClick={handleGridClick}
        role="presentation"
      >
        {/* hour rows */}
        {hours.map((h) => (
          <div key={h} className="absolute inset-x-0" style={{ top: ((h * 60 - start) / 60) * HOUR_PX }}>
            <span className="absolute -top-[7px] left-0 w-12 text-right text-[10.5px] font-semibold tabular-nums text-mute">
              {fmtHourLabel(h)}
            </span>
            <div className="absolute left-14 right-0 top-0 border-t border-line/70" aria-hidden />
            {h + 0.5 < end / 60 && (
              <div
                className="absolute left-14 right-0 border-t border-dashed border-line/40"
                style={{ top: HOUR_PX / 2 }}
                aria-hidden
              />
            )}
          </div>
        ))}
        {/* bottom edge */}
        <div className="absolute inset-x-0 bottom-0 border-t border-line/70" aria-hidden>
          <span className="absolute -top-[7px] left-0 w-12 text-right text-[10.5px] font-semibold tabular-nums text-mute">
            {fmtHourLabel(end / 60)}
          </span>
        </div>

        {/* tasks */}
        <div className="absolute bottom-0 left-16 right-1.5 top-0 sm:right-3">
          <AnimatePresence mode="popLayout">
            {laid.map(({ item, col, cols }) => {
              const renderEnd = Math.min(normEnd(item.startMin, item.endMin), DAY);
              const topPx = ((item.startMin - start) / 60) * HOUR_PX;
              const hPx = Math.max(30, ((renderEnd - item.startMin) / 60) * HOUR_PX);
              return (
                <TaskBlock
                  key={item.key + item.status}
                  inst={item}
                  category={props.categoryById.get(item.categoryId)}
                  top={topPx}
                  height={hPx}
                  col={col}
                  cols={cols}
                  hourPx={HOUR_PX}
                  isNow={
                    isToday &&
                    nowMin != null &&
                    !item.status &&
                    nowMin >= item.startMin &&
                    nowMin < renderEnd
                  }
                  hasConflict={conflicts.has(item.key)}
                  dimmed={props.filter != null && item.categoryId !== props.filter}
                  nowMin={props.nowMin}
                  onEdit={props.onEdit}
                  onToggleStatus={props.onToggleStatus}
                  onDelete={props.onDelete}
                  onAutoMove={props.onAutoMove}
                  onMoveRequest={props.onMoveRequest}
                />
              );
            })}
          </AnimatePresence>

          {/* now line */}
          {nowVisible && (
            <div
              ref={nowRef}
              className="pointer-events-none absolute -left-16 right-0 z-30"
              style={{ top: ((nowMin! - start) / 60) * HOUR_PX }}
            >
              <div className="relative border-t-2 border-danger/80">
                <span className="now-dot absolute -left-1.5 -top-[5px] size-2 rounded-full bg-danger" aria-hidden />
                <span className="absolute -top-2.5 right-0 rounded-full bg-danger px-1.5 py-px text-[10px] font-bold tabular-nums text-white shadow-sm dark:text-paper">
                  {fmtTime(nowMin!)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-line px-4 py-2 text-center text-[11px] text-mute">
        Click an empty slot to add a task · drag a block to reschedule it · buttons on a block to
        complete, skip or move it
      </p>
    </div>
  );
}

function EmptyDay({
  onAddTask,
  onAddBreak,
}: {
  onAddTask: () => void;
  onAddBreak: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center px-6 py-14 text-center"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Sunrise size={26} aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold">A completely open day</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-soft">
        Nothing is planned here yet. Block out what matters — focus work, a break, or a routine —
        and the timeline will take shape.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button onClick={onAddTask} className="btn-primary">
          <Plus size={16} aria-hidden /> Plan something
        </button>
        <button onClick={onAddBreak} className="btn-ghost">
          <Coffee size={15} aria-hidden /> Schedule a break
        </button>
      </div>
    </motion.div>
  );
}
