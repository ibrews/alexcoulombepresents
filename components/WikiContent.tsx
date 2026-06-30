import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

async function fetchWikiHome(githubUrl: string): Promise<string | null> {
  const slug = githubUrl.replace("https://github.com/", "");
  const [owner, repo] = slug.split("/");
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/wiki/${owner}/${repo}/Home.md`,
      { next: { revalidate: 3600 } }
    );
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export default async function WikiContent({ githubUrl }: { githubUrl: string }) {
  const content = await fetchWikiHome(githubUrl);
  if (!content) return null;

  return (
    <div className="glass mt-12 rounded-3xl p-8 md:p-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
        Docs · live from GitHub wiki
      </p>
      <div className="space-y-4 text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h2 className="mt-8 text-xl font-bold first:mt-0">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="mt-6 text-lg font-bold">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="mt-4 font-bold text-snow">{children}</h4>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed text-mist">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="ml-4 list-disc space-y-1 text-mist">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="ml-4 list-decimal space-y-1 text-mist">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: ({ className, children, ...props }: any) => {
              const block = className?.startsWith("language-");
              return block ? (
                <code className="block overflow-x-auto rounded-xl bg-ink/60 p-4 font-mono text-amber">
                  {children}
                </code>
              ) : (
                <code
                  className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-amber"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-teal underline decoration-teal/40 hover:decoration-teal"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-snow">{children}</strong>
            ),
            em: ({ children }) => <em className="italic text-mist/80">{children}</em>,
            blockquote: ({ children }) => (
              <blockquote className="my-2 border-l-2 border-teal/40 pl-4 text-mist/70 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-line px-3 py-2 text-left font-semibold text-snow">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-line px-3 py-2 text-mist">{children}</td>
            ),
            hr: () => <hr className="border-line" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
