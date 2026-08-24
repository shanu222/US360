"use client";

import type { Gender } from "@/lib/voice";

export function GenderSelect({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value?: string;
  onChange: (gender: Gender) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-ink">{label}</legend>
      {hint ? <p className="mb-3 text-sm text-muted">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        {(["male", "female"] as const).map((gender) => (
          <button
            key={gender}
            type="button"
            onClick={() => onChange(gender)}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              value === gender ? "border-navy bg-white text-navy" : "border-line bg-paper text-ink"
            }`}
          >
            {gender === "male" ? "Male" : "Female"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
