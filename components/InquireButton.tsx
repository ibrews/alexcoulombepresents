"use client";

import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";

export default function InquireButton({
  label,
  list,
  context,
  withMessage,
  cta,
  successMessage,
}: {
  label: string;
  list: string;
  context?: string;
  withMessage?: boolean;
  cta?: string;
  successMessage?: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <WaitlistForm
        list={list}
        context={context}
        withMessage={withMessage}
        cta={cta ?? "Send →"}
        successMessage={successMessage ?? "Thanks — Alex will be in touch."}
        compact
      />
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-amber hover:border-amber hover:text-ink"
    >
      {label}
    </button>
  );
}
