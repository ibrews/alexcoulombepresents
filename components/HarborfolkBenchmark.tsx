export type ArmyBenchmark = {
  conditions: string;
  evidenceUrl?: string;
  rows: { units: number; backend: string; seconds: number; fps: number; p99: number; max: number; slowFrames: number }[];
};

export default function HarborfolkBenchmark({ data }: { data: ArmyBenchmark }) {
  return <section className="mt-10 border-y border-teal/30 py-6" aria-label="Measured army performance">
    <p className="font-mono text-xs uppercase tracking-[.2em] text-teal">The battlefield, measured</p>
    <div tabIndex={0} role="region" aria-label="Army performance table, scroll horizontally for frame timings" className="mt-5 overflow-x-auto rounded-lg border border-line focus-visible:outline focus-visible:outline-teal">
      <table className="w-full min-w-[660px] text-left text-sm tabular-nums">
        <caption className="border-b border-line px-5 py-4 text-left text-xs leading-relaxed text-mist">{data.conditions}</caption>
        <thead className="bg-white/[.025] font-mono text-[11px] text-mist"><tr>
          <th scope="col" className="px-5 py-3">Soldiers</th><th scope="col" className="px-3 py-3">Renderer</th><th scope="col" className="px-3 py-3">Duration</th><th scope="col" className="px-3 py-3 text-right">Mean FPS</th><th scope="col" className="px-3 py-3 text-right">p99</th><th scope="col" className="px-3 py-3 text-right">Worst frame</th><th scope="col" className="px-5 py-3 text-right">Frames &gt; 33.3 ms</th>
        </tr></thead>
        <tbody>{data.rows.map((row,i)=><tr key={`${row.units}-${row.backend}-${i}`} className="border-t border-line">
          <th scope="row" className="px-5 py-4 font-mono font-normal text-teal">{row.units.toLocaleString('en-US')}</th><td className="px-3 py-4">{row.backend}</td><td className="px-3 py-4 text-mist">{row.seconds} s</td><td className="px-3 py-4 text-right font-mono">{row.fps.toFixed(1)}</td><td className="px-3 py-4 text-right font-mono text-mist">{row.p99.toFixed(1)} ms</td><td className="px-3 py-4 text-right font-mono text-mist">{row.max.toFixed(1)} ms</td><td className={`px-5 py-4 text-right font-mono ${row.slowFrames?'text-amber-300':'text-teal'}`}>{row.slowFrames.toLocaleString('en-US')}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {data.evidenceUrl?<a href={data.evidenceUrl} className="mt-4 inline-block font-mono text-xs text-teal hover:underline" download>Download the recorded frame measurements ↗</a>:null}
    <p className="mt-3 max-w-3xl text-xs leading-relaxed text-mist">Display-paced browser measurements, with saves enabled. A 33.3 ms frame is the 30 FPS budget. These results describe the stated hardware and test; the army-size slider lets you compare your own computer.</p>
  </section>;
}
