<div align="center">

# ⏱ Tempo

### A calm daily planner for tasks, routines, focus time, breaks and sleep.

Plan your day on a living timeline, watch the clock count down while you work,
and review an honest weekly report of what actually happened.

<br/>

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-14-ff0080?style=flat-square&logo=framer&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-2f6b58?style=flat-square)

</div>

---

## Table of contents

- [Why Tempo](#why-tempo)
- [Feature tour](#feature-tour)
- [Quick start](#quick-start)
- [How to use it](#how-to-use-it)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Design system](#design-system)
- [Architecture](#architecture)
- [The scheduling engine](#the-scheduling-engine)
- [Data model](#data-model)
- [Accessibility](#accessibility)
- [Privacy & storage](#privacy--storage)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Roadmap ideas](#roadmap-ideas)
- [Author](#Author)
- [License](#license)

---

## Why Tempo

Most planners are either a flat to-do list that ignores time, or a calendar so dense it
makes the day feel heavier than it is. **Tempo sits in between.**

It treats your day as a finite, visible resource: every task occupies real space on a
timeline, breaks and sleep are first-class citizens rather than afterthoughts, and the
app tells you — calmly, and out loud — when something starts, how long is left, and when
it's done.

> **Design intent:** planning should feel like tidying a desk, not filing a tax return.
> Warm paper tones, generous spacing, a serif display face, and motion that never gets in
> your way.

---

## Feature tour

### 🗓 Plan the day on a real timeline

| | |
|---|---|
| **Visual day grid** | An hour-by-hour timeline where every task is a block sized to its real duration. |
| **Click to create** | Click any empty slot and the editor opens pre-filled with that time. |
| **Drag to reschedule** | Grab a block and drag it; it snaps to 15-minute steps with a live time bubble following your cursor. |
| **Overlap-aware layout** | Clashing tasks automatically split into side-by-side columns instead of hiding each other. |
| **Overnight support** | A 10:30 PM → 7:00 AM sleep block is handled correctly and flagged `+1 day`. |
| **"Now" line** | A pulsing marker with a live time chip; the timeline auto-scrolls to it on open. |

### 🔁 One-time tasks *and* recurring routines

- Schedule a task **once** on a specific date, or as a **weekly routine** on any combination of days.
- Editing a routine asks the question that matters: **"only this day"** or **"the entire routine"**.
- Per-day overrides mean you can shift Wednesday's gym session without disturbing Monday's.
- Deleting works the same way — remove a single occurrence or the whole series.

### 🎨 Categories that mean something

Six built-ins — **Study, Work, Health, Personal, Sleep, Break** — each with its own colour,
plus unlimited custom categories with a colour picker. Categories carry behaviour, not just
colour:

- `focus` → counts toward your **focus time** statistics
- `isBreak` → gets break-specific wording and its own summary figure
- `isSleep` → tracked separately as rest, not work

Deleting a custom category safely re-homes its tasks instead of orphaning them.

### ☕ Breaks, done properly

A dedicated break flow where you choose the **duration** and **when** it happens — either at
a custom time or anchored **directly after an existing task** (*"After 'Deep work' · ends 11:00 AM"*).
The **Break** button in the header even pre-selects the next genuine gap in your schedule.

### ⚠️ Conflict detection with a real resolution

Save or drag a task onto occupied time and Tempo doesn't just complain — it offers a way out:

1. **Move to the next free slot** (calculated for you, shown as a real time)
2. **Keep the overlap** — sometimes you really do mean it
3. **Go back and adjust** the times yourself

Any overlap you choose to keep is badged on the timeline so it never becomes invisible.

### ⏳ Live countdowns & spoken-aloud scheduling

This is what makes Tempo feel alive during the day rather than just before it:

- **Click a task** → a toast tells you *"starts at 9:00 AM — that's in 1h 15m"* or *"in progress — 45m to go"*.
- **When a task starts** → *"It's 9:00 AM — time for 'Deep work'"* (breaks get their own wording).
- **While it runs** → a **digital countdown** in the sidebar (`1:24:07`, ticking every second), a live progress bar on the block itself, and a glowing active state.
- **When the time is up** → *"'Deep work' completed"* or *"Break's over — refreshed and back to it"*, and the task is **marked complete automatically** — with an **Undo** button if you're still going.
- Reopen the app after a few hours and past tasks are reconciled quietly with a single summary toast, not a flood of pop-ups.

### 📊 Daily dashboard

A sidebar that answers the useful questions at a glance:

- **Live countdown** — what's running, or what's next, to the second
- **Now / Up next** card with a progress bar
- **Completion ring** — done vs. total
- **Remaining · Focus time · Breaks · Sleep** stat grid
- **Day balance** — a 24-hour allocation bar broken down by category, your unscheduled time, and the **longest open stretch** with a one-click *"Plan something here"*

### 📈 Weekly report *(its own page at `#/report`)*

Because watching progress is half the motivation:

- **Completion ring** plus a four-way split: **Done · Skipped · Missed · Upcoming**
- **Streak counter** 🔥, best day, and total focus time completed
- **Stacked bar chart** per day — click any bar to jump straight to that day
- **Focus-time trend** across the week
- **Where your time went** — ranked category breakdown
- **"Didn't happen"** — every skipped or missed task, listed with its day and time, clickable to revisit

Crucially, it distinguishes **skipped** (you consciously passed) from **missed** (the time
passed and nothing happened) — so the report stays honest instead of flattering.

Navigate between weeks with ← / →, including past weeks.

### 🌗 Light & dark, remembered

A warm-paper light theme and a deep warm dark theme. Your choice is stored, and the first
visit respects your operating system's `prefers-color-scheme`.

### 💾 Everything persists

Tasks, routines, completion statuses, per-day overrides, custom categories and your theme
are all saved to `localStorage` — close the tab, come back tomorrow, it's all there.

---

## Quick start

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build

# preview the production build
npm run preview
```

> **Requirements:** Node 18+ and npm.

The production build is emitted as a **single self-contained `dist/index.html`**
(via `vite-plugin-singlefile`) — JS, CSS and icons inlined. You can open that file
directly from disk or drop it onto any static host with no configuration.

---

## How to use it

**Your first launch** comes pre-seeded with a realistic sample week — a morning run on
Mon/Wed/Fri, weekday deep-work blocks, lunch breaks, study sessions and a sleep routine.
They're ordinary tasks: edit them, reschedule them or delete them freely.

| I want to… | Do this |
|---|---|
| Add a task | **New task** in the header, or click any empty slot on the timeline |
| Add a break | **Break** in the header — it suggests your next real gap |
| Reschedule | Drag the block, or use the ⤓ quick-action to send it to the next free slot |
| Mark it done | Hover the block → ✓, or open it and press **Done** |
| Skip it today | Hover the block → ⏭ (routines skip only that day) |
| Edit a routine for one day only | Open it → choose **"Only <date>"** at the top |
| Filter the view | Tap a category chip above the timeline |
| Add a category | **Manage** chip, or **+ New** inside the task editor |
| See your progress | **Report** in the header, or press <kbd>R</kbd> |

Every destructive or status-changing action shows a toast with **Undo**.

---

## Keyboard shortcuts

**Planner page**

| Key | Action |
|---|---|
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / next day |
| <kbd>T</kbd> | Jump back to today |
| <kbd>R</kbd> | Open the weekly report |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Open the focused task block |
| <kbd>Esc</kbd> | Close any dialog |

**Report page**

| Key | Action |
|---|---|
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / next week |
| <kbd>T</kbd> | Back to this week |
| <kbd>Esc</kbd> | Return to the planner |

---

## Design system

Everything is driven by CSS custom properties declared once in `src/index.css` and exposed
to Tailwind v4 through `@theme inline`, so a single variable change re-themes the whole app.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | `#f7f4ee` | `#16140f` | App background |
| `--panel` | `#fffefc` | `#1f1c16` | Cards & surfaces |
| `--well` | `#f1ede4` | `#29251d` | Inputs, insets |
| `--ink` | `#23201a` | `#efebe0` | Primary text |
| `--soft` / `--mute` | — | — | Secondary / tertiary text |
| `--accent` | `#2f6b58` | `#6fbc97` | Brand green, focus rings |
| `--warn` / `--danger` | — | — | Skipped / missed & destructive |

**Typography** — *Fraunces* (serif) for display headings and numerals, *Inter* for UI text,
with tabular figures everywhere time is shown so digits never jitter while counting down.

**Motion** — Framer Motion springs for blocks, modals and toasts, wrapped in
`<MotionConfig reducedMotion="user">` so the entire app calms down automatically for anyone
with *reduce motion* enabled.

**Colour mixing** — task blocks derive their tint, border and glow from a single category
colour via `color-mix()`, which is why custom categories look native the moment you create them.

---

## Architecture

```
                 ┌─────────────────────┐
                 │   HashRouter (App)  │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │   ToastProvider     │  notifications + undo
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │  PlannerProvider    │  single source of truth
                 │  • tasks/categories │  • localStorage sync
                 │  • statuses/overrides│ • schedule engine ⏱
                 │  • theme, viewed day│  • shared actions
                 └─────┬──────────┬────┘
                       │          │
          ┌────────────▼──┐   ┌───▼─────────────┐
          │  PlannerPage  │   │   ReportPage    │
          │   `#/`        │   │   `#/report`    │
          └───────────────┘   └─────────────────┘
```

**Key decisions**

- **Hash routing.** The app ships as one inlined HTML file, so `#/report` keeps deep links
  and hard refreshes working on *any* static host without server rewrite rules.
- **Shared context, local UI state.** Persisted data and the clock engine live in
  `PlannerContext`; modal/filter state stays local to the page that owns it.
- **The schedule engine lives in the provider**, not a page — so auto-completion and
  start/finish notifications keep firing even while you're reading the weekly report.
- **Pure logic, separately testable.** All date, interval and statistics maths lives in
  `src/lib/` as pure functions with no React imports, so they can be bundled and
  exercised in plain Node.
- **Derived, never duplicated.** Task *instances* for a day are computed on demand from
  tasks + statuses + overrides, so a recurring routine is stored exactly once no matter
  how many days it appears on.

---

## The scheduling engine

The interesting problems are all in `src/lib/time.ts` and `src/lib/stats.ts`.

**Wrap-around time.** Every interval helper is "overnight aware". `normEnd()` lifts an end
time past midnight (`22:30 → 07:00` becomes `1350 → 1860`) so duration, overlap and layout
maths all work with a single code path instead of special cases.

**Column layout.** `layoutDay()` groups intervals into clusters of mutual overlap, then
greedily assigns each one the first column whose previous occupant has already ended —
the same approach calendar apps use to lay out colliding events.

**Next free slot.** `nextFreeSlot()` walks the day in 15-minute steps from a given moment
and returns the first position where a task of the required length fits without touching
anything else. It powers the conflict dialog, the ⤓ quick-action and the break suggester.

**Day coverage.** `dayCoverage()` paints the day minute-by-minute rather than summing
durations, which means **overlapping tasks are never double-counted** and overnight blocks
are correctly clipped at midnight. That keeps "% planned" honest and ≤ 100%, and it's how
the *Day balance* card finds genuine open stretches.

**Outcome classification.** `classify()` in `stats.ts` decides what truly happened to a
task: explicit `completed` / `skipped` statuses win; otherwise an un-actioned task on a past
day — or one whose window has already closed today — is counted as **missed**, while
anything still ahead is **upcoming**. Overnight tasks are never marked missed. This single
function is what lets the weekly report be candid rather than generous.

---

## Data model

```ts
interface Task {
  id: string;
  title: string;
  date: string;            // "YYYY-MM-DD" anchor (exact day for one-time tasks)
  startMin: number;        // minutes after midnight, 0–1439
  endMin: number;          // if <= startMin, the task runs past midnight
  categoryId: string;
  notes?: string;
  repeat: { type: "once" } | { type: "weekly"; days: number[] };  // 0 = Sunday
  createdAt: number;
}
```

Per-day state is keyed by **`${taskId}|${date}`**, which is the trick that makes recurring
routines work without duplicating rows:

- `StatusMap` → `"completed" | "skipped" | "hidden"` for one occurrence
- `OverrideMap` → `{ startMin, endMin }` to move a single occurrence

Rendering a day resolves these together into `TaskInstance` objects via `instancesForDate()`.

**localStorage keys**

| Key | Contents |
|---|---|
| `tempo.tasks.v1` | All tasks and routines |
| `tempo.categories.v1` | Built-in + custom categories |
| `tempo.statuses.v1` | Per-occurrence completed / skipped / hidden |
| `tempo.overrides.v1` | Per-occurrence time changes |
| `tempo.theme.v1` | `"light"` or `"dark"` |

> Keys are versioned (`.v1`) so a future schema change can migrate cleanly.
> To reset the app to its seeded sample day, clear these keys in DevTools → Application.

---

## Accessibility

- **Keyboard first** — every control is reachable and operable; task blocks are focusable
  and open with <kbd>Enter</kbd> / <kbd>Space</kbd>.
- **Visible focus** — a consistent accent focus ring on every interactive element.
- **Screen readers** — descriptive `aria-label`s on blocks (title, time range and status),
  `aria-pressed` on all toggle chips, `role="dialog"` with `aria-modal` and labelled titles,
  and `aria-live="polite"` toasts.
- **Sensible live regions** — the per-second countdown is `aria-live="off"` with a parallel
  minute-level `sr-only` announcement, so assistive tech isn't flooded with digits.
- **Reduced motion** — honoured globally through `MotionConfig`.
- **Modals** — scroll locking, <kbd>Esc</kbd> to dismiss, click-outside to close.
- **Form validation** — clear inline `role="alert"` messages for missing titles, invalid or
  zero-length times, and routines with no days selected.

---

## Privacy & storage

**Tempo has no backend, no accounts, no analytics and makes no network requests.**
Everything you type stays in your browser's `localStorage` on your own device. That also
means your plan is per-browser and per-device — clearing site data clears your plan.

---

## Project structure

```
src/
├── App.tsx                    # router + providers
├── main.tsx                   # entry point
├── index.css                  # design tokens, themes, component classes
├── types.ts                   # shared domain types
│
├── pages/
│   ├── PlannerPage.tsx        # the daily planner  (#/)
│   └── ReportPage.tsx         # the weekly report  (#/report)
│
├── store/
│   └── PlannerContext.tsx     # shared state, persistence, schedule engine
│
├── lib/
│   ├── time.ts                # dates, intervals, layout, free-slot & coverage maths
│   └── stats.ts               # outcome classification, weekly aggregation, streaks
│
├── hooks/
│   ├── useLocalStorage.ts     # persisted state with safe fallbacks
│   └── useNow.ts              # ticking clock
│
├── data/
│   └── defaults.ts            # built-in categories + seeded sample day
│
└── components/
    ├── Header.tsx             ├── Timeline.tsx         ├── TaskBlock.tsx
    ├── WeekStrip.tsx          ├── Summary.tsx          ├── LiveCountdown.tsx
    ├── DayBalance.tsx         ├── CategoryFilter.tsx   ├── WeeklyReport.tsx
    ├── TaskModal.tsx          ├── CategoryModal.tsx    ├── ConflictDialog.tsx
    ├── Modal.tsx              └── Toasts.tsx
```

---

## Tech stack

| Tool | Why |
|---|---|
| **React 19** + **TypeScript** | Strict typing across the domain model |
| **Vite 7** | Fast dev server; single-file production output |
| **Tailwind CSS 4** | `@theme inline` tokens driving both themes from CSS variables |
| **Framer Motion** | Spring physics for blocks, modals and toasts |
| **React Router 7** | Hash routing for static-host-friendly pages |
| **lucide-react** | Consistent, light icon set |

TypeScript runs in strict mode with `noUnusedLocals` and `noUnusedParameters` enabled —
`npx tsc --noEmit` passes clean.

---

## Roadmap ideas

Natural next steps, none of which the current architecture fights against:

- [ ] Export / import a plan as JSON, and an `.ics` calendar export
- [ ] Browser notifications (the engine that drives toasts already emits the right events)
- [ ] Drag the top or bottom edge of a block to resize its duration
- [ ] Reusable day templates ("deep work day", "rest day")
- [ ] Monthly view and longer-range trends
- [ ] Pomodoro mode that auto-inserts breaks into a long session
- [ ] Optional cloud sync behind the existing storage hook

---

## Author

<table>
  <tr>
    <td>
      <img src="https://avatars.githubusercontent.com/ahmed200-em?s=100" width="80" height="80" alt="Author avatar" />
    </td>
    <td>
      <strong>Ahmed Elmakrini</strong>
      <br/>
      <sub>Built for anyone who wants their day to feel planned, not packed.</sub>
      <br/><br/>
      <a href="https://modern-portfolio-93c7xd0ub-ahmed200-ems-projects.vercel.app/">
        <img src="https://img.shields.io/badge/🌐_Portfolio-visit-2f6b58?style=flat-square" alt="Portfolio" />
      </a>
      &nbsp;
      <a href="https://github.com/ahmed200-em">
        <img src="https://img.shields.io/badge/GitHub-Ahmed-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
  </tr>
</table>

<div align="center">
<br/>

**Built for anyone who wants their day to feel planned, not packed.**

<br/>

<sub>Designed, built and maintained by <a href="https://modern-portfolio-93c7xd0ub-ahmed200-ems-projects.vercel.app/">Ahmed Elmakrini</a> · <a href="https://github.com/ahmed200-em">GitHub</a> · <a href="https://modern-portfolio-93c7xd0ub-ahmed200-ems-projects.vercel.app/">Portfolio</a></sub>

</div>

---

## License

Released under the **MIT License** — free to use, modify and share.

<div align="center">
<br/>

**Built for anyone who wants their day to feel planned, not packed.**

</div>
