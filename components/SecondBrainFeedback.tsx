"use client";

import { useEffect, useState } from "react";
import { FEEDBACK_CONSENT_VERSION, FEEDBACK_WORKFLOW_IDS, FEEDBACK_STEP_IDS, FEEDBACK_OUTCOMES, FEEDBACK_ASSISTANCE, FEEDBACK_ENVIRONMENTS, FEEDBACK_REASON_CODES, FEEDBACK_DURATION_BUCKETS, type FeedbackPayload, type FeedbackSelfExport } from "@/lib/secondBrain/feedback";
import { KIT_RELEASE_ID } from "@/lib/secondBrain/course";

const endpoint = "/api/second-brain/feedback";
export default function SecondBrainFeedback({ canSubmit }: { canSubmit: boolean }) {
  const [data, setData] = useState<FeedbackSelfExport | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<FeedbackPayload | null>(null);
  useEffect(() => { fetch(endpoint, { cache: "no-store" }).then(async r => { if (!r.ok) throw Error(); setData(await r.json()); }).catch(() => setMessage("Feedback controls are unavailable. Your kit access is unchanged.")); }, []);
  const enabled = data?.consent.enabled && data.consent.version === FEEDBACK_CONSENT_VERSION;

  async function request(method: string, body?: unknown) {
    const response = await fetch(endpoint, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    if (!response.ok) throw Error();
    return response.json();
  }
  async function consent() {
    setBusy(true); setMessage("");
    try { setData(await request("POST", { action: "consent", enabled: true, consentVersion: FEEDBACK_CONSENT_VERSION })); setAgree(false); setMessage("Optional feedback is enabled. Nothing is submitted until you preview and send a result."); }
    catch { setMessage("Could not save consent. Please try again. Kit access is unchanged."); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    setBusy(true); setMessage("");
    try { setData(await request("DELETE")); setPreview(null); setAgree(false); setMessage("Feedback is off. Your stored pilot feedback and participant mapping have been deleted."); }
    catch { setMessage("Withdrawal could not be confirmed. Please try again."); }
    finally { setBusy(false); }
  }
  async function send() {
    if (!preview) return;
    setBusy(true); setMessage("");
    try {
      await request("POST", { action: "submit", consentVersion: FEEDBACK_CONSENT_VERSION, payload: preview });
      setPreview(null);
      setMessage("Result submitted. Thank you.");
      try { setData(await request("GET")); }
      catch { setMessage("Result submitted. The stored-result count could not refresh; use Export my feedback to check it later."); }
    } catch { setMessage("Submission could not be confirmed. You can retry this same result safely."); }
    finally { setBusy(false); }
  }
  async function exportOwn() {
    setBusy(true); setMessage("");
    try {
      const own = await request("GET"); setData(own);
      const url = URL.createObjectURL(new Blob([JSON.stringify(own, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "ACP-pilot-feedback.json"; link.click(); URL.revokeObjectURL(url);
    } catch { setMessage("Could not export your feedback. Please try again."); }
    finally { setBusy(false); }
  }
  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = { submissionId: crypto.randomUUID(), attemptId: crypto.randomUUID(), eventType: "workflow_outcome" };
    for (const key of ["workflowId", "stepId", "outcome", "assistance", "environment", "reasonCode", "durationBucket"]) { const value = String(form.get(key) ?? ""); if (value) payload[key] = value; }
    setPreview(payload as FeedbackPayload); setMessage("");
  }
  function choice(name: string, label: string, options: readonly string[], optional = false) {
    return <label className="block text-sm">{label}<select name={name} required={!optional} className="mt-2 block w-full rounded-lg border border-line bg-ink p-3 text-snow">{optional && <option value="">Do not share</option>}{options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>;
  }
  return <section className="glass mt-8 rounded-2xl p-7" aria-labelledby="feedback-title">
    <h2 id="feedback-title" className="text-xl font-bold">Optional pilot feedback</h2>
    <p className="mt-3 text-sm leading-relaxed text-mist">Help ACP learn whether the kit works for you. ACP stores only the choices you explicitly submit: exercise, step, result, help received, and any optional platform, reason or time range. Each result also includes random attempt and submission IDs, the kit release and a timestamp. We collect no prompts, conversations, files, recordings, paths or automatic usage events through this form.</p>
    <p className="mt-3 text-sm text-mist">Results are linked to a random research ID; a separate account mapping allows your export and deletion. This is pseudonymous, not anonymous. ACP uses results to improve teaching and the kit, expires them after 90 days and deletes them during the next daily cleanup, and does not publish identifiable results. Withdrawal deletes stored results and the account mapping. Account, hosting and download logs are separate from this optional feedback.</p>
    <p className="mt-3 text-sm text-mist">Consent notice {FEEDBACK_CONSENT_VERSION}. Declining or withdrawing does not change kit access.</p>
    {data && !enabled && canSubmit && <div className="mt-5"><label className="flex gap-3 text-sm"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} disabled={busy} />I choose to share the results I explicitly submit under this notice.</label><button className="mt-4 rounded-full border border-line px-5 py-2 disabled:opacity-50" disabled={!agree || busy} onClick={consent}>Enable optional feedback</button></div>}
    {enabled && canSubmit && <form className="mt-6 space-y-4" onSubmit={prepare}>
      {choice("workflowId", "Exercise", FEEDBACK_WORKFLOW_IDS)}
      {choice("stepId", "Step (optional)", FEEDBACK_STEP_IDS, true)}
      {choice("outcome", "Result", FEEDBACK_OUTCOMES)}
      {choice("assistance", "Help received", FEEDBACK_ASSISTANCE)}
      {choice("environment", "Platform (optional)", FEEDBACK_ENVIRONMENTS, true)}
      {choice("reasonCode", "Reason (optional)", FEEDBACK_REASON_CODES, true)}
      {choice("durationBucket", "Time spent (optional)", FEEDBACK_DURATION_BUCKETS, true)}
      <button disabled={busy} className="rounded-full border border-line px-5 py-2 disabled:opacity-50">Preview result</button>
    </form>}
    {preview && enabled && canSubmit && <div className="mt-5 rounded-lg border border-line p-4"><h3 className="font-bold">Review before sending</h3><pre className="mt-3 overflow-auto text-xs">{JSON.stringify({ ...preview, releaseId: KIT_RELEASE_ID, recordedAt: "assigned by server when submitted" }, null, 2)}</pre><button disabled={busy} onClick={send} className="mt-4 rounded-full bg-snow px-5 py-2 text-ink disabled:opacity-50">Send this result</button><button disabled={busy} onClick={() => setPreview(null)} className="ml-4 text-sm text-teal">Discard preview</button></div>}
    {data && <div className="mt-6 flex flex-wrap gap-4"><button disabled={busy} onClick={exportOwn} className="text-sm text-teal">Export my feedback</button><button disabled={busy} onClick={withdraw} className="text-sm text-teal">Turn off and delete my feedback</button><span className="text-sm text-mist">{data.feedback.length} stored results · feedback {enabled ? "on" : "off"}</span></div>}
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
