import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import DevlogNote from "@/components/DevlogNote";
import { repos } from "@/lib/data";

const repo = repos.find((r) => r.slug === "claude-fleet")!;

export const metadata: Metadata = {
  title: "Claude Fleet — Fleet Hive Devlog",
  description:
    "A LiteLLM gateway plus a parallel multi-model orchestrator for Claude Fleet — built by dogfooding the fleet itself, with models cross-checking each other's fabrications along the way.",
  alternates: { canonical: "/repos/claude-fleet/devlog" },
};

export default function ClaudeFleetDevlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/repos/claude-fleet" className="font-mono text-sm text-mist hover:text-teal">
          ← Claude Fleet
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-amber">Devlog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Building Fleet Hive</h1>
        <p className="mt-5 text-xl leading-relaxed text-mist">
          Claude Fleet already coordinates multiple machines running Claude Code. Fleet Hive is the
          layer underneath that: one gateway for every model you have a key for — local Ollama boxes,
          Gemini, NVIDIA NIM, Groq, Cerebras — plus a small orchestrator that fans a prompt out to
          several of them at once and has models from different families adversarially judge each
          other&apos;s answers.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          It was built the way it argues you should build things: an AI orchestrating research and
          implementation across a fleet of other models, catching a real hallucination from one of its
          own research sources along the way — not a hypothetical, an actual fabricated config syntax
          that made it one review pass deep before a different model family called it out.
        </p>
      </Reveal>

      {/* ── Origins ───────────────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">01 · Origins</p>
          <h2 className="mt-3 text-2xl font-bold">Routing answers &ldquo;which model.&rdquo; Hive answers &ldquo;how many at once.&rdquo;</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              Claude Fleet&apos;s existing{" "}
              <Link href="/repos/claude-fleet" className="text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal">
                model routing
              </Link>{" "}
              guide is about picking the cheapest model that can do a job correctly. That solves cost —
              it doesn&apos;t solve throughput. Even with a garage full of GPUs and a drawer of API keys,
              every one of those lanes spoke a different dialect: bespoke <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">curl</code>{" "}
              flags for Ollama, a different auth header for NIM, a different base URL for each cloud
              provider. Work happened one dispatch at a time no matter how much hardware was sitting
              idle.
            </p>
            <p>
              The fix splits into two deliberately separable pieces. A gateway —{" "}
              <a href="https://github.com/BerriAI/litellm" target="_blank" rel="noopener noreferrer" className="text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal">
                LiteLLM Proxy
              </a>, free and open-source — puts every lane behind one OpenAI-compatible endpoint with
              named aliases, load-balancing, cooldowns, and fallback chains. And a thin, stdlib-only
              Python CLI on top that does the part a router genuinely can&apos;t: fire the same prompt at
              several aliases in parallel, and convene a panel of judges — deliberately from{" "}
              <em>different model families</em> than the one being graded — to try to refute a
              generation rather than rubber-stamp it.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── The build itself ─────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">02 · Method</p>
          <h2 className="mt-3 text-2xl font-bold">The build dogfooded the thing it was building</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              Research ran off-budget first: a round of web search plus a synthesis pass from a
              large cloud model produced a verdict (build the hybrid — gateway plus custom orchestrator)
              and a config sketch. Then a second model, from a different family, was asked to
              adversarially verify that sketch against the same evidence rather than take it on faith.
            </p>
            <p>
              It caught real fabrications: three LiteLLM configuration constructs — a nonexistent{" "}
              <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">model_group:</code>{" "}
              key, an invented <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">virtual_keys:</code>{" "}
              section, a claim that budgets work over SQLite — that the first model had stated with
              total confidence and that were simply wrong, checked against the project&apos;s actual
              documentation. That near-miss is the whole argument for the judge-panel pattern baked into
              the CLI: a single fluent answer, even from a strong model, is not the same thing as a
              verified one.
            </p>
            <p>
              The implementation that followed split the same way: separate files were generated in
              parallel by different providers — one by a NIM-hosted model, one by Gemini, one by a
              Groq-hosted model — reviewed by yet another set of models from different families, then
              integrated and live-tested end to end on real hardware. Building the thing whose whole
              point is &ldquo;models checking each other&rdquo; by actually having models check each
              other.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Gotchas found the hard way ────────────────────────────── */}
      <Reveal>
        <div className="mt-14">
          <p className="font-mono text-xs uppercase tracking-widest text-sky">03 · Gotchas found the hard way</p>
          <h2 className="mt-3 text-2xl font-bold">What live traffic revealed that no design doc predicted</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-mist">
            Every one of these showed up only once real requests hit real machines — the kind of thing
            a spec review can&apos;t catch and a live gateway eventually will.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <DevlogNote title="A socket timeout doesn't bound total request time" tag="reliability">
              <p>
                A client call passed <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">timeout=300</code>{" "}
                to <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">urllib</code>{" "}
                and still hung for over twenty minutes. The gateway was dribbling keep-alive bytes while
                internally retrying a dead upstream, which resets what a plain socket read-timeout
                actually bounds. The fix wraps every gateway call in a hard total deadline enforced by a
                worker-thread future — the only way to guarantee a call actually returns by a fixed wall-
                clock time, independent of what the server on the other end is doing.
              </p>
            </DevlogNote>

            <DevlogNote title="Fallback chains follow exactly one hop" tag="litellm">
              <p>
                The config wired alias A to fall back to B, and separately wired B to fall back to C —
                reasonable to assume the router would walk A → B → C if both A and B failed. It doesn&apos;t.
                When B also fails, the router looks up <em>B&apos;s own</em> fallback list rather than
                continuing down A&apos;s original one. Every link in a chain needs its own explicit
                fallback entry; nothing walks a list further than one hop for you.
              </p>
            </DevlogNote>

            <DevlogNote title="Reasoning models can spend their whole budget on tokens you never see" tag="model behavior">
              <p>
                A local reasoning model returned empty content no matter the prompt — turned out the
                gateway simply doesn&apos;t forward an Ollama-specific &ldquo;disable thinking&rdquo;
                parameter at all, so the model burned its entire token budget on hidden reasoning and
                had nothing left for the answer. The same failure shape reappeared later on two cloud
                models (a GLM reasoning tier and Gemini 2.5 Pro/Flash) under a small{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">max_tokens</code>:
                {" "}<code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">finishReason: MAX_TOKENS</code>,
                zero visible text. The general lesson: a &ldquo;thinking&rdquo; model&apos;s hidden
                tokens and its visible answer draw from the same pool, so any caller-facing token budget
                has to assume that.
              </p>
            </DevlogNote>

            <DevlogNote title="A network fix that was really an old fix, forgotten" tag="ops">
              <p>
                One machine&apos;s local model server was reachable from its own terminal but invisible
                to every other machine on the network — bound to <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">127.0.0.1</code>{" "}
                instead of all interfaces. The exact same failure, on a different machine, had already
                been diagnosed and fixed weeks earlier and wasn&apos;t applied fleet-wide — the second
                occurrence cost real debugging time chasing gateway timeouts before anyone thought to
                check the simplest possible cause first.
              </p>
            </DevlogNote>

            <DevlogNote title="A bare Python User-Agent gets you blocked, not denied" tag="edge cases">
              <p>
                One cloud provider&apos;s edge returned a 403 that looked like a bad API key — Cloudflare
                error 1010, &ldquo;access denied by browser signature.&rdquo; The key was fine; the block
                was on the default <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">Python-urllib/3.x</code>{" "}
                User-Agent string that Python&apos;s standard library sends by default. Every outbound
                call now sends a curl-style header instead.
              </p>
            </DevlogNote>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-14 flex flex-wrap gap-3">
          <a
            href={repo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            View on GitHub →
          </a>
          <Link
            href="/repos/claude-fleet"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape/60"
          >
            Back to the repo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
