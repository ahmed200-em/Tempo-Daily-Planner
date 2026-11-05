import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Category, OverrideMap, StatusMap, Task, TaskInstance } from "../types";
import {
  durationOf,
  fmtDur,
  fmtRange,
  fmtTime,
  instancesForDate,
  todayKey,
} from "../lib/time";
import { DEFAULT_CATEGORIES, seedTasks } from "../data/defaults";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNow } from "../hooks/useNow";
import { useToast } from "../components/Toasts";
import { newCategoryFrom } from "../components/TaskModal";

interface PlannerValue {
  tasks: Task[];
  setTasks: (v: Task[] | ((p: Task[]) => Task[])) => void;
  categories: Category[];
  setCategories: (v: Category[] | ((p: Category[]) => Category[])) => void;
  statuses: StatusMap;
  setStatuses: (v: StatusMap | ((p: StatusMap) => StatusMap)) => void;
  overrides: OverrideMap;
  setOverrides: (v: OverrideMap | ((p: OverrideMap) => OverrideMap)) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  /** currently viewed day, shared across routes */
  dateKey: string;
  setDateKey: (v: string | ((p: string) => string)) => void;
  now: ReturnType<typeof useNow>;
  categoryById: Map<string, Category>;
  toggleStatus: (inst: TaskInstance, s: "completed" | "skipped") => void;
  addCategory: (input: { label: string; color: string; focus: boolean }) => Category;
  deleteCategory: (id: string) => void;
}

const Ctx = createContext<PlannerValue | null>(null);

/* Suppresses auto-completion for one occurrence. Keyed by the end time so a
   later reschedule is eligible to auto-complete again. */
const autoSkipKey = (inst: TaskInstance) => `${inst.key}|${inst.endMin}`;

export function usePlanner() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return v;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const [tasks, setTasks] = useLocalStorage<Task[]>("tempo.tasks.v1", seedTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "tempo.categories.v1",
    () => DEFAULT_CATEGORIES
  );
  const [statuses, setStatuses] = useLocalStorage<StatusMap>("tempo.statuses.v1", () => ({}));
  const [overrides, setOverrides] = useLocalStorage<OverrideMap>("tempo.overrides.v1", () => ({}));
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("tempo.theme.v1", () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [dateKey, setDateKey] = useState(todayKey());

  const now = useNow();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  /* ---------------- schedule engine (runs on every route) ----------------
     Announces tasks as they start, toasts when a task or break's time runs
     out, and marks it complete automatically. */
  const prevMinRef = useRef<number | null>(null);
  const firstTickRef = useRef(true);
  const notifiedRef = useRef<Set<string>>(new Set());
  const autoSkipRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const firstTick = firstTickRef.current;
    const prevMin = prevMinRef.current;
    const todayInsts = instancesForDate(tasks, statuses, overrides, now.key);

    const finishKeys: string[] = [];
    const justFinished: TaskInstance[] = [];
    const justStarted: TaskInstance[] = [];

    for (const inst of todayInsts) {
      const overnight = inst.endMin <= inst.startMin;
      const finished = !overnight && now.min >= inst.endMin;

      if (!inst.status && finished) {
        if (autoSkipRef.current.has(autoSkipKey(inst))) continue;
        finishKeys.push(inst.key);
        if (
          !firstTick &&
          prevMin != null &&
          prevMin < inst.endMin &&
          !notifiedRef.current.has(`end|${inst.key}|${inst.endMin}`)
        ) {
          justFinished.push(inst);
        }
        notifiedRef.current.add(`end|${inst.key}|${inst.endMin}`);
        continue;
      }
      if (
        !inst.status &&
        !firstTick &&
        prevMin != null &&
        prevMin < inst.startMin &&
        now.min >= inst.startMin &&
        !notifiedRef.current.has(`start|${inst.key}|${inst.startMin}`)
      ) {
        justStarted.push(inst);
        notifiedRef.current.add(`start|${inst.key}|${inst.startMin}`);
      }
    }

    if (finishKeys.length > 0) {
      setStatuses((map) => {
        const n = { ...map };
        for (const k of finishKeys) n[k] = "completed";
        return n;
      });
      if (firstTick) {
        toast({
          kind: "info",
          title: `${finishKeys.length} finished ${
            finishKeys.length > 1 ? "tasks were" : "task was"
          } marked complete`,
          description: "Their scheduled time already passed.",
        });
      }
    }

    for (const inst of justFinished) {
      const isBreak = !!categoryById.get(inst.categoryId)?.isBreak;
      toast({
        kind: "success",
        title: isBreak ? "Break's over — refreshed and back to it" : `“${inst.title}” completed`,
        description: `${fmtRange(inst.startMin, inst.endMin)} · time's up, marked done.`,
        duration: 6000,
        action: {
          label: "Undo",
          onClick: () => {
            autoSkipRef.current.add(autoSkipKey(inst));
            setStatuses((map) => {
              const n = { ...map };
              delete n[inst.key];
              return n;
            });
          },
        },
      });
    }

    for (const inst of justStarted) {
      const isBreak = !!categoryById.get(inst.categoryId)?.isBreak;
      const dur = durationOf(inst.startMin, inst.endMin);
      toast({
        kind: "info",
        title: isBreak
          ? `Break time — ${fmtDur(dur)} to recharge`
          : `It's ${fmtTime(inst.startMin)} — time for “${inst.title}”`,
        description: `${fmtDur(dur)} planned · ends ${fmtTime(inst.endMin)}. Watch the countdown on the timeline.`,
        duration: 6000,
      });
    }

    firstTickRef.current = false;
    prevMinRef.current = now.min;
  }, [now.min, now.key, tasks, statuses, overrides, categoryById, setStatuses, toast]);

  /* ---------------- shared actions ---------------- */
  function toggleStatus(inst: TaskInstance, s: "completed" | "skipped") {
    const prev = statuses[inst.key];
    const same = prev === s;
    const overnight = inst.endMin <= inst.startMin;
    if (same && !overnight && now.min >= inst.endMin) {
      // Clearing a past task's status should stick instead of being
      // auto-completed again by the schedule engine on the next tick.
      autoSkipRef.current.add(autoSkipKey(inst));
    }
    setStatuses((map) => {
      const n = { ...map };
      if (same) delete n[inst.key];
      else n[inst.key] = s;
      return n;
    });
    toast({
      kind: same ? "info" : s === "completed" ? "success" : "info",
      title: same
        ? `“${inst.title}” is back on the plan`
        : s === "completed"
          ? `Done — “${inst.title}”`
          : `Skipped “${inst.title}” for today`,
      action: {
        label: "Undo",
        onClick: () =>
          setStatuses((map) => {
            const n = { ...map };
            if (prev) n[inst.key] = prev;
            else delete n[inst.key];
            return n;
          }),
      },
    });
  }

  function addCategory(input: { label: string; color: string; focus: boolean }) {
    const c = newCategoryFrom(input);
    setCategories((cs) => [...cs, c]);
    toast({ kind: "success", title: `Category “${c.label}” created` });
    return c;
  }

  function deleteCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const inUse = tasks.some((t) => t.categoryId === id);
    if (inUse) {
      setTasks((ts) => ts.map((t) => (t.categoryId === id ? { ...t, categoryId: "personal" } : t)));
    }
    setCategories((cs) => cs.filter((c) => c.id !== id));
    toast({
      kind: "info",
      title: `Category “${cat.label}” removed`,
      description: inUse ? "Its tasks were moved to Personal." : undefined,
    });
  }

  const value: PlannerValue = {
    tasks,
    setTasks,
    categories,
    setCategories,
    statuses,
    setStatuses,
    overrides,
    setOverrides,
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    dateKey,
    setDateKey,
    now,
    categoryById,
    toggleStatus,
    addCategory,
    deleteCategory,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
