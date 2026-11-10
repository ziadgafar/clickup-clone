import { useState } from "react";
import Avatar from "./Avatar";

// Native <select> can't show avatars, hence this small listbox.
// value: "" = all, "-" = unassigned, otherwise a name.
export default function AssigneePicker({ value, onChange, people, me, className = "" }) {
  const [open, setOpen] = useState(false);
  const label = (v) =>
    v === "" ? "All assignees" : v === "-" ? "Unassigned" : v === me ? `${v} (me)` : v;
  const options = ["", "-", ...people];

  return (
    <div
      className={`relative ${className}`}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white text-sm cursor-pointer"
      >
        {value && value !== "-" && <Avatar name={value} className="w-5 h-5 text-[9px]" />}
        <span className="truncate">{label(value)}</span>
        <span className="ml-auto pl-2 text-neutral-400">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full min-w-48 max-h-72 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg py-1"
        >
          {options.map((v) => (
            <li key={v}>
              <button
                type="button"
                role="option"
                aria-selected={v === value}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer ${
                  v === value ? "font-bold" : ""
                }`}
              >
                {v && v !== "-" ? (
                  <Avatar name={v} className="w-5 h-5 text-[9px]" />
                ) : (
                  <span className="w-5" />
                )}
                <span className="truncate">{label(v)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
