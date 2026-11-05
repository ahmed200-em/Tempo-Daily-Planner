import type { Category, Task } from "../types";
import { todayKey } from "../lib/time";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "study", label: "Study", color: "#6876e0", builtin: true, focus: true },
  { id: "work", label: "Work", color: "#3d9ab8", builtin: true, focus: true },
  { id: "health", label: "Health", color: "#4da46e", builtin: true },
  { id: "personal", label: "Personal", color: "#d96a85", builtin: true },
  { id: "sleep", label: "Sleep", color: "#8f72d8", builtin: true, isSleep: true },
  { id: "break", label: "Break", color: "#dda032", builtin: true, isBreak: true },
];

export const CUSTOM_COLORS = [
  "#6876e0",
  "#3d9ab8",
  "#4da46e",
  "#8ba848",
  "#dda032",
  "#e0664a",
  "#d96a85",
  "#b45fc9",
  "#8f72d8",
  "#8d8578",
];

const EVERYDAY = [0, 1, 2, 3, 4, 5, 6];

export function seedTasks(): Task[] {
  const t = todayKey();
  let n = 0;
  const mk = (p: Partial<Task> & Pick<Task, "title" | "startMin" | "endMin" | "categoryId">): Task => ({
    id: `seed-${++n}`,
    date: t,
    notes: "",
    repeat: { type: "once" },
    createdAt: Date.now() + n,
    ...p,
  });

  return [
    mk({
      title: "Wake up slowly",
      startMin: 390, // 6:30
      endMin: 405,
      categoryId: "health",
      repeat: { type: "weekly", days: EVERYDAY },
      notes: "Water, daylight, no phone for 15 minutes.",
    }),
    mk({
      title: "Morning run",
      startMin: 420, // 7:00
      endMin: 465,
      categoryId: "health",
      repeat: { type: "weekly", days: [1, 3, 5] },
    }),
    mk({
      title: "Yoga & mobility",
      startMin: 600, // 10:00
      endMin: 640,
      categoryId: "health",
      repeat: { type: "weekly", days: [0, 6] },
    }),
    mk({
      title: "Deep work — focus block",
      startMin: 540, // 9:00
      endMin: 660,
      categoryId: "work",
      repeat: { type: "weekly", days: [1, 2, 3, 4, 5] },
      notes: "Silence notifications. One thing at a time.",
    }),
    mk({
      title: "Lunch & short walk",
      startMin: 750, // 12:30
      endMin: 795,
      categoryId: "break",
      repeat: { type: "weekly", days: EVERYDAY },
    }),
    mk({
      title: "Study — reading & notes",
      startMin: 960, // 16:00
      endMin: 1050,
      categoryId: "study",
      repeat: { type: "weekly", days: [1, 2, 4] },
    }),
    mk({
      title: "Dinner with family",
      startMin: 1140, // 19:00
      endMin: 1200,
      categoryId: "personal",
      repeat: { type: "once" },
      date: t,
    }),
    mk({
      title: "Wind down & sleep",
      startMin: 1350, // 22:30
      endMin: 420, // -> 7:00 next day
      categoryId: "sleep",
      repeat: { type: "weekly", days: EVERYDAY },
      notes: "Screens off by 10 PM.",
    }),
  ];
}
