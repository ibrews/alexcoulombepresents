"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      name && `Name: ${name}`,
      email && `Email: ${email}`,
      "",
      message,
    ]
      .filter((l) => l !== undefined)
      .join("\n");
    window.location.href = `mailto:info@alexcoulombepresents.com?subject=${encodeURIComponent(
      subject || "General inquiry"
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field =
    "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-snow placeholder:text-mist/50 focus:border-teal/60 focus:outline-none transition-colors";

  if (sent) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-4xl">✦</p>
        <p className="mt-4 font-bold">Opening your mail client…</p>
        <p className="mt-2 text-sm text-mist">
          If it didn&apos;t open,{" "}
          <a
            className="text-teal hover:underline"
            href="mailto:info@alexcoulombepresents.com"
          >
            email directly
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
            Name
          </label>
          <input
            className={field}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
            Email
          </label>
          <input
            className={field}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
          Subject
        </label>
        <input
          className={field}
          type="text"
          placeholder="What's on your mind?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
          Message
        </label>
        <textarea
          className={`${field} min-h-[160px] resize-y`}
          placeholder="Tell me about your project, question, or idea…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-snow px-7 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
      >
        Send message →
      </button>
    </form>
  );
}
