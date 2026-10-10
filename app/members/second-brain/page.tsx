import Link from "next/link";
import { cookies } from "next/headers";
import { customerFromSession } from "@/lib/commerce/tokens";
import { getSecondBrainAccess } from "@/lib/secondBrain/access";
import { KIT_RELEASE_ID, KIT_SHA256 } from "@/lib/secondBrain/course";
import { materialHref } from "@/lib/classMaterials";
import SecondBrainFeedback from "@/components/SecondBrainFeedback";

export const metadata = { title: "ACP Second Brain", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SecondBrainPage() {
  const customerId = await customerFromSession((await cookies()).get("acp_session")?.value).catch(() => null);
  const access = await getSecondBrainAccess(customerId);
  return <main className="mx-auto max-w-3xl px-5 pb-24 pt-32">
    <p className="font-mono text-sm text-teal">ACP Second Brain · course pilot</p>
    <h1 className="mt-3 text-4xl font-bold">Your first AI workflow kit</h1>
    <p className="mt-5 text-mist">Practice private project memory, verify a fresh output, and stop and resume a bounded job. This candidate prepares you for the two November masterclasses.</p>
    {!customerId ? <div className="glass mt-8 rounded-2xl p-7">
      <h2 className="text-xl font-bold">Sign in to open the kit</h2>
      <p className="mt-3 text-mist">Use the email associated with your ACP membership or either November AI masterclass purchase.</p>
      <Link className="mt-5 inline-block text-teal hover:underline" href="/account?next=%2Fmembers%2Fsecond-brain">Sign in →</Link>
    </div> : !access.allowed ? <div className="glass mt-8 rounded-2xl p-7">
      <h2 className="font-bold">Kit access is unavailable for this account</h2>
      <p className="mt-3 text-mist">An active ACP membership or a non-refunded purchase of either November AI masterclass opens this version.</p>
      <Link href="/account" className="mt-4 inline-block text-teal">Review your account →</Link>
    </div> : <section className="glass mt-8 rounded-2xl p-7">
      <h2 className="text-xl font-bold">Download and start</h2>
      <p className="mt-3 text-sm text-mist">Candidate {KIT_RELEASE_ID} · Python 3.11 or newer · fictional local exercises. Unreal, a headset, and paid API access are optional for this first kit.</p>
      <a href={materialHref(access.downloadClass!, "second-brain-kit")} className="mt-5 inline-block rounded-full bg-snow px-6 py-3 font-semibold text-ink">Download course kit ZIP</a>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-mist">
        <li>Extract the ZIP into a new folder you control. Open README.md, then start-here/README.md.</li>
        <li>Follow workflows/part-1-exercise.md to make a private project copy, retrieve a recipe, and verify your own output.</li>
        <li>Follow workflows/between-class-practice.md. Save your project memory in your private folder, including the exact working folder, checkpoint, verified next commands and stop conditions.</li>
        <li>Open a fresh assistant session and give it your project memory. Then follow workflows/part-2-exercise.md to checkpoint and resume the job.</li>
      </ol>
      <p className="mt-5 text-sm text-mist">The kit includes a local search connector and a manual reading path. Your prompts, files, and outputs stay with the tools and folders you choose. Keep personal and client information out of this exercise.</p>
      <details className="mt-5 text-sm"><summary className="cursor-pointer text-teal">Check the download</summary><p className="mt-3">SHA-256:</p><code className="block break-all">{KIT_SHA256}</code></details>
    </section>}
    {customerId && <SecondBrainFeedback canSubmit={access.allowed} />}
    <p className="mt-8 text-sm text-mist">Pilot feedback is optional. You can use the kit with feedback off.</p>
  </main>;
}
