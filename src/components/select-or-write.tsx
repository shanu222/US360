"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  addItems,
  extrasNotInOptions,
  isSelected,
  joinList,
  parseList,
  removeItem,
  toggleItem,
} from "@/engine/profile-options";

export function SelectOrWrite({
  value,
  onChange,
  options,
  mode = "multi",
  placeholder = "Or write your own",
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  mode?: "multi" | "single";
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const selected = parseList(value);
  const extra = extrasNotInOptions(selected, options);

  function apply(next: string[]) {
    onChange(joinList(next));
  }

  function addCustom() {
    const next = addItems(selected, draft, mode === "multi");
    apply(next);
    setDraft("");
  }

  return (
    <div className="space-y-3">
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const on = isSelected(selected, option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => apply(toggleItem(selected, option, mode === "multi"))}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  on ? "bg-navy text-cream" : "border border-line bg-paper text-ink hover:bg-white"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
      {extra.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {extra.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => apply(removeItem(selected, item))}
              className="rounded-full bg-navy px-3 py-1.5 text-sm text-cream"
              title="Remove"
            >
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          className="h-12 shrink-0 rounded-2xl border border-line bg-white px-4 text-sm font-medium text-ink"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-muted">Tap to select, or write your own. You can do both.</p>
    </div>
  );
}
