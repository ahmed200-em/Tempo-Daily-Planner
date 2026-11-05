import { dateFromKey, todayKey, weekDates } from "../lib/time";

interface WeekStripProps {
  dateKey: string;
  counts: Record<string, number>;
  doneCounts: Record<string, number>;
  onSelect: (key: string) => void;
}

const MON_FIRST_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekStrip({ dateKey, counts, doneCounts, onSelect }: WeekStripProps) {
  const days = weekDates(dateKey);
  const today = todayKey();

  return (
    <div
      role="group"
      aria-label="Jump to a day this week"
      className="card flex items-stretch justify-between gap-1 p-1.5"
    >
      {days.map((key, i) => {
        const selected = key === dateKey;
        const isToday = key === today;
        const total = counts[key] ?? 0;
        const done = doneCounts[key] ?? 0;
        const d = dateFromKey(key);
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            aria-pressed={selected}
            aria-label={`${MON_FIRST_LETTERS[i]} ${d.getDate()} — ${new Intl.DateTimeFormat(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
              }
            ).format(d)}`}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-all ${
              selected
                ? "bg-ink text-paper shadow-sm"
                : "text-soft hover:bg-well hover:text-ink"
            } ${isToday && !selected ? "ring-1 ring-inset ring-accent/60" : ""}`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                selected ? "text-paper/70" : "text-mute"
              }`}
            >
              {MON_FIRST_LETTERS[i]}
            </span>{" "}
            <span className="font-display text-lg font-medium leading-none">
              {d.getDate()}
            </span>
            <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
              {total > 0 ? (
                Array.from({ length: Math.min(3, total) }).map((_, j) => (
                  <span
                    key={j}
                    className={`size-1 rounded-full ${
                      selected
                        ? "bg-paper/70"
                        : j < Math.ceil((done / Math.max(total, 1)) * Math.min(3, total))
                          ? "bg-accent"
                          : "bg-line"
                    }`}
                  />
                ))
              ) : (
                <span className={`size-1 rounded-full ${selected ? "bg-paper/30" : "bg-line/60"}`} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
