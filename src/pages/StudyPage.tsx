import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { useToast } from "../components/Toasts";
import { addDays, DAY, findConflicts, fmtRange, instancesForDate, normEnd, uid } from "../lib/time";
import { usePlanner } from "../store/PlannerContext";
import type { Task } from "../types";

export default function StudyPage() {
  const { tasks, setTasks, statuses, overrides, theme, toggleTheme, dateKey, setDateKey, now } = usePlanner();
  const navigate = useNavigate();
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(dateKey);
  const [start, setStart] = useState("16:00");
  const [focus, setFocus] = useState("45");
  const [rest, setRest] = useState("10");
  const [rounds, setRounds] = useState("2");
  const [error, setError] = useState("");

  const [hour, minute] = start.split(":").map(Number);
  const startMin = hour * 60 + minute;
  const focusMin = Number(focus);
  const restMin = Number(rest);
  const count = Number(rounds);
  const end = startMin + focusMin * count + restMin * (count - 1);
  const valid = Number.isInteger(startMin) && startMin >= 0 && startMin < DAY &&
    [focusMin, restMin, count].every(Number.isInteger) &&
    focusMin > 0 && restMin >= 0 && count >= 1 && count <= 12 && end <= DAY;
  const blocks: Pick<Task, "title" | "categoryId" | "startMin" | "endMin">[] = [];
  if (valid) {
    for (let i = 0; i < count; i++) {
      const from = startMin + i * (focusMin + restMin);
      const to = from + focusMin;
      blocks.push({ title: subject.trim() || "Study", categoryId: "study", startMin: from, endMin: to % DAY });
      if (restMin > 0 && i < count - 1) {
        blocks.push({ title: "Study break", categoryId: "break", startMin: to, endMin: to + restMin });
      }
    }
  }

  async function importStudyPlan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const data: unknown = JSON.parse(await file.text());
      if (!Array.isArray(data) || !data.length || !data.every(isStudyPlanTask)) {
        throw new Error("Invalid study plan");
      }

      const ids = new Set(tasks.map((task) => task.id));
      const additions = data.filter((task) => {
        if (ids.has(task.id)) return false;
        ids.add(task.id);
        return true;
      });
      if (!additions.length) {
        toast({ kind: "info", title: "This study plan is already imported" });
        return;
      }

      setTasks((current) => {
        const currentIds = new Set(current.map((task) => task.id));
        return [...current, ...additions.filter((task) => !currentIds.has(task.id))
          .map((task) => ({ ...task, createdAt: Date.now() }))];
      });
      setDateKey(additions.find((task) => task.date >= now.key)?.date ?? additions[0].date);
      toast({ kind: "success", title: `Added ${additions.length} study blocks` });
      navigate("/");
    } catch {
      toast({ kind: "warn", title: "Could not import this plan", description: "Select tempo-study-plan.json and try again." });
    }
  }

  function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !date || !subject.trim()) {
      setError("Enter a subject and choose times that fit within one day.");
      return;
    }

    const existing = instancesForDate(tasks, statuses, overrides, date);
    const overnight = instancesForDate(tasks, statuses, overrides, addDays(date, -1))
      .filter((task) => normEnd(task.startMin, task.endMin) > DAY)
      .map((task) => ({ ...task, startMin: 0, endMin: task.endMin }));
    const conflicts = findConflicts([...overnight, ...existing], { startMin, endMin: end % DAY });
    if (conflicts.length) {
      setError(`This plan overlaps with ${conflicts.map((task) => task.title).join(", ")}. Choose a different start time or date.`);
      return;
    }

    const additions: Task[] = blocks.map((block) => ({
      ...block, date, id: uid(), repeat: { type: "once" }, createdAt: Date.now(),
    }));
    setTasks((current) => [...current, ...additions]);
    setDateKey(date);
    toast({ kind: "success", title: "Study plan added to your timeline" });
    navigate("/");
  }

  return (
    <div className="app-bg min-h-screen bg-paper font-sans text-ink">
      <Header page="study" dateKey={dateKey} isToday={dateKey === now.key} theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Study planner</h1>
        <p className="mt-2 text-sm text-soft">Plan focused study blocks and add breaks between them.</p>
        <section className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Import a study plan</h2>
            <p className="mt-1 text-sm text-soft">Add the sessions from your plan file to your daily timeline.</p>
          </div>
          <label className="btn-ghost cursor-pointer focus-within:outline focus-within:outline-accent">
            Import study plan
            <input type="file" className="sr-only" accept=".json,application/json" onChange={importStudyPlan} />
          </label>
        </section>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <form className="card space-y-4 p-5" onSubmit={schedule} onChange={() => setError("")}>
            <label className="block text-sm font-semibold">
              Subject
              <input className="field mt-1" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Linear algebra" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Date<input className="field mt-1" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="text-sm font-semibold">Start time<input className="field mt-1" type="time" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold">Focus (min)<input className="field mt-1" type="number" min="1" required value={focus} onChange={(e) => setFocus(e.target.value)} /></label>
              <label className="text-sm font-semibold">Break (min)<input className="field mt-1" type="number" min="0" required value={rest} onChange={(e) => setRest(e.target.value)} /></label>
              <label className="text-sm font-semibold">Focus blocks<input className="field mt-1" type="number" min="1" max="12" required value={rounds} onChange={(e) => setRounds(e.target.value)} /></label>
            </div>
            <p className="text-xs text-soft">Set break time to 0 for back-to-back focus blocks.</p>
            {error && <p role="alert" className="rounded-lg border border-line bg-well p-3 text-sm">{error}</p>}
            <button className="btn-primary" type="submit">Add to timeline</button>
          </form>
          <section className="card self-start p-5" aria-label="Schedule preview">
            <h2 className="font-display text-xl font-semibold">Schedule preview</h2>
            {blocks.length ? (
              <ol className="mt-3 space-y-2">
                {blocks.map((block) => (
                  <li key={block.startMin} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-well px-3 py-2 text-sm">
                    <span className="min-w-0 break-words font-semibold">{block.title}</span>
                    <span className="text-soft">{fmtRange(block.startMin, block.endMin)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 text-sm text-soft">Choose times that fit within one day to see your schedule.</p>}
          </section>
        </div>
      </main>
    </div>
  );
}

function isStudyPlanTask(value: unknown): value is Omit<Task, "createdAt"> {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<Task>;
  const { startMin, endMin } = task;
  if (typeof task.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(task.date)) return false;
  const parsedDate = new Date(task.date);
  return Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === task.date &&
    typeof task.id === "string" && task.id.startsWith("excel-fsth-") &&
    typeof task.title === "string" && Boolean(task.title.trim()) &&
    (task.notes === undefined || typeof task.notes === "string") &&
    task.categoryId === "study" && task.repeat?.type === "once" &&
    typeof startMin === "number" && Number.isInteger(startMin) && startMin >= 0 &&
    typeof endMin === "number" && Number.isInteger(endMin) && endMin > startMin && endMin < DAY;
}
