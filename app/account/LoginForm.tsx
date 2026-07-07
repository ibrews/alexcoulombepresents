"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    await fetch("/api/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="mt-6 text-sm text-teal">Check your inbox for a sign-in link.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-6 flex w-full max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-full border border-line bg-black/20 px-4 py-2 text-sm outline-none focus:border-teal/60"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send link"}
      </button>
    </form>
  );
}
