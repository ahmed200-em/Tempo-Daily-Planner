import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import { friendlyDate } from "../lib/time";

interface HeaderProps {
  /** which page is showing — controls the middle nav + actions */
  page: "planner" | "report" | "study";
  dateKey: string;
  isToday: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onAddTask?: () => void;
  onAddBreak?: () => void;
}

export function Header({
  page,
  dateKey,
  isToday,
  theme,
  onToggleTheme,
  onPrev,
  onNext,
  onToday,
  onAddTask,
  onAddBreak,
}: HeaderProps) {
  const isPlanner = page === "planner";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-sm dark:text-[#101410]">
            <CalendarClock size={19} aria-hidden />
          </span>
          <div className="leading-none">
            <p className="font-display text-[1.35rem] font-semibold tracking-tight">Tempo</p>
            <p className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-mute sm:block">
              Daily planner
            </p>
          </div>
        </Link>

        {isPlanner ? (
          <nav aria-label="Change day" className="ml-2 flex items-center gap-1 sm:ml-6">
            <button className="icon-btn" onClick={onPrev} aria-label="Previous day" title="Previous day (←)">
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={onToday}
              disabled={isToday}
              className="hidden h-9 items-center rounded-full border border-line bg-panel px-3.5 text-xs font-bold uppercase tracking-wider text-soft transition-colors hover:text-ink disabled:opacity-40 sm:inline-flex"
              title="Jump back to today (T)"
            >
              Today
            </button>
            <button className="icon-btn" onClick={onNext} aria-label="Next day" title="Next day (→)">
              <ChevronRight size={17} />
            </button>
            <span className="ml-1 hidden whitespace-nowrap font-display text-sm font-medium text-soft md:block">
              {friendlyDate(dateKey)}
            </span>
          </nav>
        ) : (
          <p className="ml-2 hidden font-display text-sm font-medium text-soft sm:ml-6 sm:block">
            {page === "study" ? "Study planner" : "Weekly report"}
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isPlanner ? (
            <>
              <Link className="btn-ghost !px-2 sm:!px-4" to="/study" aria-label="Study planner" title="Study planner">
                <BookOpen size={16} aria-hidden />
                <span className="hidden md:inline">Study</span>
              </Link>
              <Link className="btn-ghost !px-3 sm:!px-4" to="/report" title="Weekly report (R)">
                <BarChart3 size={16} aria-hidden />
                <span className="hidden md:inline">Report</span>
              </Link>
              <button className="btn-ghost !px-3 sm:!px-4" onClick={onAddBreak} title="Add a break">
                <Coffee size={16} aria-hidden />
                <span className="hidden sm:inline">Break</span>
              </button>
              <button className="btn-primary !px-3 sm:!px-4" onClick={onAddTask} title="Add a task">
                <Plus size={16} aria-hidden />
                <span className="hidden sm:inline">New task</span>
              </button>
            </>
          ) : (
            <Link className="btn-primary !px-3 sm:!px-4" to="/" title="Back to the planner">
              <CalendarDays size={16} aria-hidden />
              <span className="hidden sm:inline">Back to planner</span>
              <span className="sm:hidden">Planner</span>
            </Link>
          )}
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="grid place-items-center"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={16} />}
            </motion.span>
          </button>
        </div>
      </div>
    </header>
  );
}
