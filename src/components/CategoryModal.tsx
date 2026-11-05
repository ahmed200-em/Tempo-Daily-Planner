import { useState } from "react";
import { Lock, Plus, Trash2, X } from "lucide-react";
import type { Category } from "../types";
import { CUSTOM_COLORS } from "../data/defaults";
import { Modal } from "./Modal";

interface CategoryModalProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onAdd: (input: { label: string; color: string; focus: boolean }) => void;
  onDelete: (id: string) => void;
}

export function CategoryModal({ open, categories, onClose, onAdd, onDelete }: CategoryModalProps) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(CUSTOM_COLORS[5]);
  const [focus, setFocus] = useState(true);

  const add = () => {
    const l = label.trim();
    if (!l) return;
    onAdd({ label: l, color, focus });
    setLabel("");
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="cat-modal-title">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 id="cat-modal-title" className="font-display text-xl font-semibold">
            Categories
          </h2>
          <p className="mt-0.5 text-xs text-mute">Color-code the parts of your day</p>
        </div>
        <button onClick={onClose} className="icon-btn !size-8" aria-label="Close dialog">
          <X size={15} />
        </button>
      </div>

      <div className="max-h-[46vh] space-y-1.5 overflow-y-auto px-5 py-4">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-well/40 px-3 py-2.5">
            <span className="size-3 rounded-full" style={{ background: c.color }} aria-hidden />
            <span className="flex-1 text-sm font-semibold">{c.label}</span>
            {c.focus && (
              <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                focus
              </span>
            )}
            {c.builtin ? (
              <span className="text-mute" title="Built-in category">
                <Lock size={13} aria-hidden />
              </span>
            ) : (
              <button
                onClick={() => onDelete(c.id)}
                className="rounded-md p-1 text-mute transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={`Delete category ${c.label}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-line px-5 py-4">
        <p className="label !mb-0">Add your own</p>
        <input
          className="field"
          placeholder="Category name — e.g. Commute, Music, Side project"
          value={label}
          maxLength={20}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="New category name"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pick a color">
          {CUSTOM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-pressed={color === c}
              aria-label={`Color ${c}`}
              className={`size-6 rounded-full transition-transform ${
                color === c ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-panel" : "hover:scale-110"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-soft">
          <input
            type="checkbox"
            checked={focus}
            onChange={(e) => setFocus(e.target.checked)}
            className="size-3.5 accent-[#2f6b58]"
          />
          Counts as focus time in the daily summary
        </label>
        <button
          className="btn-primary w-full justify-center"
          onClick={add}
          disabled={!label.trim()}
          style={!label.trim() ? { opacity: 0.5 } : undefined}
        >
          <Plus size={15} aria-hidden /> Add category
        </button>
      </div>
    </Modal>
  );
}
