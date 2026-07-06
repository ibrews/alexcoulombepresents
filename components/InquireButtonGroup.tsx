"use client";

import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";

type Option = {
  label: string;
  context: string;
  successMessage?: string;
};

// A row of pill buttons that share ONE form instead of each button opening
// its own copy — pick a topic, the form appears once, tagged with which one
// you picked. Use this instead of multiple standalone <InquireButton>s
// whenever the options are variations on "get in touch about X."
export default function InquireButtonGroup({
  list,
  options,
  withMessage,
}: {
  list: string;
  options: Option[];
  withMessage?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        {options.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setSelected(i)}
            className={`inline-block rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
              selected === i
                ? "border-amber bg-amber text-ink"
                : "border-line hover:border-amber hover:bg-amber hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selected !== null && (
        <WaitlistForm
          list={list}
          context={options[selected].context}
          withMessage={withMessage}
          cta="Send →"
          successMessage={options[selected].successMessage ?? "Thanks — Alex will be in touch."}
          compact
        />
      )}
    </div>
  );
}
