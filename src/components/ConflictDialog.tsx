import { AlertTriangle, ArrowDownToDot, Check, PencilLine, X } from "lucide-react";
import type { Category, TaskInstance } from "../types";
import { fmtRange, fmtTime, fmtDur } from "../lib/time";
import { Modal } from "./Modal";

export interface ConflictState {
  title: string;
  range: string;
  conflicts: TaskInstance[];
  /** next free slot start (minutes), null when the rest of the day is full */
  slot: number | null;
  dur: number;
  onKeep: () => void;
  onAdjust: (() => void) | null;
  onEdit: () => void;
}

interface ConflictDialogProps {
  state: ConflictState | null;
  categoryById: Map<string, Category>;
}

export function ConflictDialog({ state, categoryById }: ConflictDialogProps) {
  return (
    <Modal open={state != null} onClose={state?.onEdit ?? (() => {})} labelledBy="conflict-title">
      {state && (
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warn/15 text-warn">
              <AlertTriangle size={18} aria-hidden />
            </span>
            <div>
              <h2 id="conflict-title" className="font-display text-lg font-semibold leading-tight">
                This overlaps your plans
              </h2>
              <p className="mt-0.5 text-xs text-soft">
                “{state.title}” · {state.range}
              </p>
            </div>
            <button onClick={state.onEdit} className="icon-btn !size-8 ml-auto" aria-label="Back to editing">
              <X size={15} />
            </button>
          </div>

          <ul className="mt-4 space-y-1.5" aria-label="Conflicting tasks">
            {state.conflicts.map((c) => {
              const cat = categoryById.get(c.categoryId);
              return (
                <li
                  key={c.key}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-well/50 px-3 py-2"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: cat?.color ?? "var(--mute)" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-mute">
                    {fmtRange(c.startMin, c.endMin)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-col gap-2">
            {state.onAdjust && state.slot != null && (
              <button className="btn-primary justify-center" onClick={state.onAdjust} autoFocus>
                <ArrowDownToDot size={15} aria-hidden />
                Move to {fmtTime(state.slot)} ({fmtDur(state.dur)}, next free slot)
              </button>
            )}
            <button className="btn-ghost justify-center" onClick={state.onKeep}>
              <Check size={15} aria-hidden />
              Keep the overlap — I&apos;ll manage
            </button>
            <button
              className="justify-center rounded-full px-4 py-2 text-sm font-semibold text-mute transition-colors hover:text-ink"
              onClick={state.onEdit}
            >
              <span className="inline-flex items-center gap-1.5">
                <PencilLine size={14} aria-hidden /> Go back and adjust the times
              </span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
