import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Hand,
  Keyboard,
  MousePointerClick,
  PartyPopper,
} from "lucide-react";
import type { SavePayload, Task, TaskInstance } from "../types";
import {
  addDays,
  ceilToSnap,
  countForDate,
  DAY,
  durationOf,
  findConflicts,
  fmtDur,
  fmtRange,
  fmtTime,
  friendlyDate,
  instKey,
  instancesForDate,
  nextFreeSlot,
  normEnd,
  occursOn,
  relativeDay,
  shortDate,
  todayKey,
  uid,
  weekDates,
} from "../lib/time";
import { useToast } from "../components/Toasts";
import { usePlanner } from "../store/PlannerContext";
import { Header } from "../components/Header";
import { WeekStrip } from "../components/WeekStrip";
import { Summary } from "../components/Summary";
import { CategoryFilter } from "../components/CategoryFilter";
import { Timeline } from "../components/Timeline";
import { TaskModal, type TaskPreset } from "../components/TaskModal";
import { ConflictDialog, type ConflictState } from "../components/ConflictDialog";
import { CategoryModal } from "../components/CategoryModal";
import { LiveCountdown } from "../components/LiveCountdown";
import { DayBalance } from "../components/DayBalance";
import { WeekProgressCard, useWeekStats } from "../components/WeeklyReport";
import type { MoveRequest } from "../components/TaskBlock";

export default function PlannerPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const {
    tasks,
    setTasks,
    categories,
    statuses,
    setStatuses,
    overrides,
    setOverrides,
    theme,
    toggleTheme,
    dateKey,
    setDateKey,
    now,
    categoryById,
    toggleStatus,
    addCategory,
    deleteCategory,
  } = usePlanner();

  /* ---------------- ephemeral, page-local state ---------------- */
  const [filter, setFilter] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    initial: TaskInstance | null;
    preset: TaskPreset | null;
  } | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);

  const isToday = dateKey === now.key;
  const nowMin = isToday ? now.min : null;

  const instances = useMemo(
    () => instancesForDate(tasks, statuses, overrides, dateKey),
    [tasks, statuses, overrides, dateKey]
  );

  const weekStats = useWeekStats(
    tasks,
    statuses,
    overrides,
    categories,
    dateKey,
    now.min
  );

  const { counts, doneCounts } = useMemo(() => {
    const c: Record<string, number> = {};
    const d: Record<string, number> = {};
    for (const k of weekDates(dateKey)) {
      c[k] = countForDate(tasks, statuses, k);
      let done = 0;
      for (const t of tasks) {
        if (occursOn(t, k) && statuses[instKey(t.id, k)] === "completed") done++;
      }
      d[k] = done;
    }
    return { counts: c, doneCounts: d };
  }, [tasks, statuses, dateKey]);

  /* ---------------- keyboard day navigation ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalState || conflict || catModalOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") setDateKey((k) => addDays(k, -1));
      else if (e.key === "ArrowRight") setDateKey((k) => addDays(k, 1));
      else if (e.key.toLowerCase() === "t") setDateKey(todayKey());
      else if (e.key.toLowerCase() === "r") navigate("/report");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalState, conflict, catModalOpen, navigate, setDateKey]);

  /* ---------------- opening modals ---------------- */
  const openCreate = (preset: TaskPreset | null = null) =>
    setModalState({ mode: "create", initial: null, preset });

  const openEdit = (inst: TaskInstance) => {
    // schedule insight toast so the set time is always obvious on click
    if (!inst.status) {
      const cat = categoryById.get(inst.categoryId);
      const isBreak = !!cat?.isBreak;
      const dur = durationOf(inst.startMin, inst.endMin);
      const name = `“${inst.title}”`;
      if (isToday && nowMin != null) {
        if (nowMin < inst.startMin) {
          toast({
            kind: "info",
            title: `${isBreak ? "Break" : name} starts at ${fmtTime(inst.startMin)}`,
            description: `That's in ${fmtDur(inst.startMin - nowMin)} · ${fmtDur(dur)} planned.`,
            duration: 5000,
          });
        } else if (nowMin < normEnd(inst.startMin, inst.endMin)) {
          toast({
            kind: "info",
            title: `${isBreak ? "Break" : name} is in progress`,
            description: `${fmtDur(normEnd(inst.startMin, inst.endMin) - nowMin)} to go · ends ${fmtTime(inst.endMin)}.`,
            duration: 5000,
          });
        }
      } else {
        toast({
          kind: "info",
          title: `${relativeDay(dateKey)} at ${fmtTime(inst.startMin)}`,
          description: `${isBreak ? "Break" : "Planned"} for ${fmtDur(dur)} · ${fmtRange(inst.startMin, inst.endMin)}.`,
          duration: 5000,
        });
      }
    }
    setModalState({ mode: "edit", initial: inst, preset: null });
  };

  const openSlotCreate = (min: number) => openCreate({ startMin: min, durationMin: 60 });

  const openBreak = () => {
    const suggested = nextFreeSlot(
      instances,
      nowMin != null ? nowMin : 12 * 60,
      15
    );
    openCreate({
      categoryId: "break",
      title: "Break",
      startMin: suggested ?? undefined,
      durationMin: 15,
    });
  };

  /* ---------------- save / conflict flow ---------------- */
  function commitSave(p: SavePayload) {
    if (p.id) {
      const t = tasks.find((x) => x.id === p.id);
      if (!t) return;
      if (p.occurrenceOnly && t.repeat.type === "weekly") {
        setOverrides((o) => ({
          ...o,
          [instKey(p.id!, dateKey)]: { startMin: p.startMin, endMin: p.endMin },
        }));
        toast({
          kind: "success",
          title: "Time changed for this day only",
          description: shortDate(dateKey) + " · the routine itself is unchanged.",
        });
      } else {
        setTasks((ts) =>
          ts.map((x) =>
            x.id === p.id
              ? {
                  ...x,
                  title: p.title,
                  categoryId: p.categoryId,
                  notes: p.notes,
                  repeat: p.repeat,
                  date: p.repeat.type === "once" ? p.date : x.date,
                  startMin: p.startMin,
                  endMin: p.endMin,
                }
              : x
          )
        );
        toast({ kind: "success", title: `“${p.title}” updated` });
      }
    } else {
      const task: Task = {
        id: uid(),
        title: p.title,
        categoryId: p.categoryId,
        date: p.date,
        startMin: p.startMin,
        endMin: p.endMin,
        repeat: p.repeat,
        notes: p.notes,
        createdAt: Date.now(),
      };
      setTasks((ts) => [...ts, task]);
      toast({
        kind: "success",
        title: `“${p.title}” added`,
        description:
          p.repeat.type === "weekly"
            ? `Repeats weekly — ${fmtRange(p.startMin, p.endMin)}`
            : p.date !== dateKey
              ? `Scheduled for ${shortDate(p.date)} · ${fmtRange(p.startMin, p.endMin)}`
              : fmtRange(p.startMin, p.endMin),
      });
    }
    setModalState(null);
  }

  function requestSave(p: SavePayload) {
    const checkDate =
      p.occurrenceOnly || p.repeat.type === "weekly" ? dateKey : p.date;
    const others = instancesForDate(tasks, statuses, overrides, checkDate).filter(
      (i) => i.id !== p.id
    );
    const conflicts = findConflicts(others, { startMin: p.startMin, endMin: p.endMin });
    if (conflicts.length === 0) {
      commitSave(p);
      return;
    }
    const dur = durationOf(p.startMin, p.endMin);
    const slot = nextFreeSlot(others, p.startMin, dur);
    setConflict({
      title: p.title,
      range: fmtRange(p.startMin, p.endMin),
      conflicts,
      slot,
      dur,
      onKeep: () => {
        setConflict(null);
        commitSave(p);
      },
      onAdjust:
        slot != null
          ? () => {
              setConflict(null);
              commitSave({ ...p, startMin: slot, endMin: (slot + dur) % DAY });
            }
          : null,
      onEdit: () => setConflict(null),
    });
  }

  /* ---------------- moving ---------------- */
  function applyMove(inst: TaskInstance, s: number, e: number) {
    if (inst.repeat.type === "weekly") {
      setOverrides((o) => ({ ...o, [inst.key]: { startMin: s, endMin: e } }));
    } else {
      setTasks((ts) => ts.map((t) => (t.id === inst.id ? { ...t, startMin: s, endMin: e } : t)));
    }
  }

  function moveToast(title: string, inst: TaskInstance, undoS: number, undoE: number) {
    toast({
      kind: "success",
      title,
      action: { label: "Undo", onClick: () => applyMove(inst, undoS, undoE) },
    });
  }

  function requestMove({ inst, newStart }: MoveRequest) {
    const dur = durationOf(inst.startMin, inst.endMin);
    const newEnd = (newStart + dur) % DAY;
    const fromS = inst.startMin;
    const fromE = inst.endMin;
    const others = instances.filter((i) => i.key !== inst.key);
    const conflicts = findConflicts(others, { startMin: newStart, endMin: newEnd });
    if (conflicts.length === 0) {
      applyMove(inst, newStart, newEnd);
      moveToast(`Moved to ${fmtRange(newStart, newEnd)}`, inst, fromS, fromE);
      return;
    }
    const slot = nextFreeSlot(others, newStart, dur);
    setConflict({
      title: inst.title,
      range: fmtRange(newStart, newEnd),
      conflicts,
      slot,
      dur,
      onKeep: () => {
        setConflict(null);
        applyMove(inst, newStart, newEnd);
        moveToast(`Moved to ${fmtRange(newStart, newEnd)}`, inst, fromS, fromE);
      },
      onAdjust:
        slot != null
          ? () => {
              setConflict(null);
              applyMove(inst, slot, (slot + dur) % DAY);
              moveToast(`Moved to ${fmtTime(slot)}`, inst, fromS, fromE);
            }
          : null,
      onEdit: () => setConflict(null), // revert: leave times untouched
    });
  }

  function autoMove(inst: TaskInstance) {
    const dur = durationOf(inst.startMin, inst.endMin);
    const others = instances.filter((i) => i.key !== inst.key);
    const earliest =
      nowMin != null && nowMin > inst.startMin ? ceilToSnap(nowMin) : inst.startMin + 15;
    const slot = nextFreeSlot(others, earliest, dur);
    if (slot == null) {
      toast({
        kind: "warn",
        title: "No free slot left today",
        description: "Try shortening it, or move something else first.",
      });
      return;
    }
    const fromS = inst.startMin;
    const fromE = inst.endMin;
    applyMove(inst, slot, (slot + dur) % DAY);
    moveToast(`Rescheduled to ${fmtTime(slot)}`, inst, fromS, fromE);
  }

  /* ---------------- delete ---------------- */
  function deleteTask(inst: TaskInstance, scope: "this" | "all") {
    if (scope === "this" && inst.repeat.type === "weekly") {
      setStatuses((s) => ({ ...s, [inst.key]: "hidden" }));
      setModalState(null);
      toast({
        kind: "info",
        title: `Removed “${inst.title}” for this day`,
        description: "The routine continues on its other days.",
        action: {
          label: "Undo",
          onClick: () =>
            setStatuses((s) => {
              const n = { ...s };
              delete n[inst.key];
              return n;
            }),
        },
      });
      return;
    }
    const index = tasks.findIndex((t) => t.id === inst.id);
    const removed = tasks[index];
    if (!removed) return;
    setTasks((ts) => ts.filter((t) => t.id !== removed.id));
    setModalState(null);
    toast({
      kind: "info",
      title: `Deleted “${inst.title}”`,
      action: {
        label: "Undo",
        onClick: () =>
          setTasks((ts) => [...ts.slice(0, index), removed, ...ts.slice(index)]),
      },
    });
  }

  /** quick delete from a block: hide this day's instance for routines */
  function quickDelete(inst: TaskInstance) {
    deleteTask(inst, inst.repeat.type === "weekly" ? "this" : "all");
  }

  function handleDeleteCategory(id: string) {
    deleteCategory(id);
    if (filter === id) setFilter(null);
  }

  /* ---------------- render ---------------- */
  return (
    <div className="app-bg min-h-screen bg-paper font-sans text-ink">
      <Header
        page="planner"
        dateKey={dateKey}
        isToday={isToday}
        theme={theme}
        onPrev={() => setDateKey((k) => addDays(k, -1))}
        onNext={() => setDateKey((k) => addDays(k, 1))}
        onToday={() => setDateKey(todayKey())}
        onToggleTheme={toggleTheme}
        onAddTask={() => openCreate()}
        onAddBreak={openBreak}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        {/* heading */}
        <section className="flex flex-wrap items-end justify-between gap-3 pt-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {relativeDay(dateKey)}
            </p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              {friendlyDate(dateKey)}
            </h1>
            <p className="mt-1 text-sm text-soft">
              {instances.length === 0
                ? "Nothing planned yet"
                : `${instances.length} planned · ${
                    instances.filter((i) => i.status === "completed").length
                  } done`}
              {isToday && nowMin != null && (
                <span className="text-mute"> · it's {fmtTime(nowMin)}</span>
              )}
            </p>
          </div>
        </section>

        <div className="mt-5">
          <WeekStrip dateKey={dateKey} counts={counts} doneCounts={doneCounts} onSelect={setDateKey} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          {/* sidebar */}
          <div className="order-2 space-y-3 lg:sticky lg:top-[5.5rem] lg:order-1 lg:self-start">
            <LiveCountdown
              instances={instances}
              categoryById={categoryById}
              isToday={isToday}
              onOpen={openEdit}
            />
            <Summary
              instances={instances}
              categoryById={categoryById}
              nowMin={nowMin}
              dateKey={dateKey}
              isToday={isToday}
            />
            <DayBalance
              instances={instances}
              categoryById={categoryById}
              nowMin={nowMin}
              onPlanGap={(startMin, durationMin) => openCreate({ startMin, durationMin })}
            />
            <WeekProgressCard stats={weekStats} onOpen={() => navigate("/report")} />
            <ShortcutsCard />
          </div>

          {/* timeline column */}
          <div className="order-1 min-w-0 space-y-3 lg:order-2">
            <CategoryFilter
              categories={categories}
              instances={instances}
              filter={filter}
              onFilter={setFilter}
              onManage={() => setCatModalOpen(true)}
            />
            <Timeline
              dateKey={dateKey}
              instances={instances}
              categoryById={categoryById}
              nowMin={nowMin}
              isToday={isToday}
              filter={filter}
              onSlotClick={openSlotCreate}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
              onDelete={quickDelete}
              onAutoMove={autoMove}
              onMoveRequest={requestMove}
              onAddTask={() => openCreate()}
              onAddBreak={openBreak}
            />
          </div>
        </div>
      </main>

      <TaskModal
        open={modalState != null}
        mode={modalState?.mode ?? "create"}
        viewDate={dateKey}
        initial={modalState?.initial ?? null}
        preset={modalState?.preset ?? null}
        categories={categories}
        anchorOptions={instances}
        nowMin={nowMin}
        onClose={() => setModalState(null)}
        onSave={requestSave}
        onDelete={deleteTask}
        onToggleStatus={toggleStatus}
        onCreateCategory={addCategory}
      />

      <ConflictDialog state={conflict} categoryById={categoryById} />

      <CategoryModal
        open={catModalOpen}
        categories={categories}
        onClose={() => setCatModalOpen(false)}
        onAdd={addCategory}
        onDelete={handleDeleteCategory}
      />

    </div>
  );
}

function ShortcutsCard() {
  const rows = [
    { icon: <MousePointerClick size={13} aria-hidden />, text: "Click an empty slot in the timeline to plan there" },
    { icon: <Hand size={13} aria-hidden />, text: "Drag a block to move it to a new time" },
    { icon: <ArrowLeftRight size={13} aria-hidden />, text: "Use ← and → to switch days" },
    { icon: <Keyboard size={13} aria-hidden />, text: "Press T for today, R for the weekly report" },
  ];
  return (
    <aside className="mt-4 hidden lg:block">
      <div className="card p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mute">
          Quick keys
        </p>
        <ul className="mt-2.5 space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2.5 text-xs text-soft">
              <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line bg-well text-mute">
                {r.icon}
              </span>
              {r.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-mute">
          <PartyPopper size={12} aria-hidden /> Your plan saves automatically in this browser.
        </p>
      </div>
    </aside>
  );
}
