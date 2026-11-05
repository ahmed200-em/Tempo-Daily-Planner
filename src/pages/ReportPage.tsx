import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarRange, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { usePlanner } from "../store/PlannerContext";
import { Header } from "../components/Header";
import { ReportBody, useWeekStats } from "../components/WeeklyReport";
import { addDays, shortDate, todayKey, weekDates } from "../lib/time";

export default function ReportPage() {
  const {
    tasks,
    statuses,
    overrides,
    categories,
    dateKey,
    setDateKey,
    now,
    theme,
    toggleTheme,
  } = usePlanner();
  const navigate = useNavigate();

  /** the report has its own week cursor, seeded from the day you were viewing */
  const [anchor, setAnchor] = useState(dateKey);
  const week = weekDates(anchor);
  const stats = useWeekStats(tasks, statuses, overrides, categories, anchor, now.min);
  const thisWeek = weekDates(todayKey())[0] === week[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // keyboard: ← / → change week, T returns to this week, Esc back to planner
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") setAnchor((a) => addDays(a, -7));
      else if (e.key === "ArrowRight") setAnchor((a) => addDays(a, 7));
      else if (e.key.toLowerCase() === "t") setAnchor(todayKey());
      else if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const goToDay = (key: string) => {
    setDateKey(key);
    navigate("/");
  };

  const hasAnything = stats.total > 0;

  return (
    <div className="app-bg min-h-screen bg-paper font-sans text-ink">
      <Header
        page="report"
        dateKey={dateKey}
        isToday={dateKey === now.key}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-wrap items-end justify-between gap-4 pt-6"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {thisWeek ? "This week" : "Week of"}
            </p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              {shortDate(week[0])} – {shortDate(week[6])}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-soft">
              <CalendarRange size={13} aria-hidden />
              {hasAnything
                ? `${stats.completed} done · ${stats.skipped + stats.missed} not done · ${stats.upcoming} upcoming`
                : "Nothing was scheduled this week"}
            </p>
          </div>

          <nav aria-label="Change week" className="flex items-center gap-1">
            <button
              className="icon-btn"
              onClick={() => setAnchor((a) => addDays(a, -7))}
              aria-label="Previous week"
              title="Previous week (←)"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => setAnchor(todayKey())}
              disabled={thisWeek}
              className="inline-flex h-9 items-center rounded-full border border-line bg-panel px-3.5 text-xs font-bold uppercase tracking-wider text-soft transition-colors hover:text-ink disabled:opacity-40"
              title="Back to this week (T)"
            >
              This week
            </button>
            <button
              className="icon-btn"
              onClick={() => setAnchor((a) => addDays(a, 7))}
              aria-label="Next week"
              title="Next week (→)"
            >
              <ChevronRight size={17} />
            </button>
          </nav>
        </motion.section>

        <motion.div
          key={week[0]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {hasAnything ? (
            <ReportBody stats={stats} onGoToDay={goToDay} />
          ) : (
            <div className="card flex flex-col items-center px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-well text-mute">
                <Inbox size={26} aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">
                No data for this week
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-soft">
                Once tasks are scheduled during these dates, your progress, focus time and
                streaks will appear here.
              </p>
              <button className="btn-primary mt-5" onClick={() => goToDay(week[0])}>
                Plan this week
              </button>
            </div>
          )}
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-mute">
          Use ← and → to change week · press Esc to go back to the planner
        </p>
      </main>
    </div>
  );
}
