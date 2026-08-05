"use client";

import { useState } from "react";

export default function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-1 flex items-start gap-2">
      <code className="block flex-1 break-all rounded-lg border border-line bg-black/20 p-3 text-xs">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-line px-3 py-3 text-xs font-semibold text-mist transition-colors hover:text-snow"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
