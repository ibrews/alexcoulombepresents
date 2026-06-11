import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Alex Coulombe Presents" className="-ml-3 w-48" />
          <p className="mt-2 text-sm text-mist">
            Unreal Engine · Godot · Apple Vision Pro · AI agents · live immersive theatre. Made in New York.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-mist">Explore</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Link className="text-mist hover:text-snow" href="/about">About</Link>
            <Link className="text-mist hover:text-snow" href="/training">Training</Link>
            <Link className="text-mist hover:text-snow" href="/repos">Open Source</Link>
            <Link className="text-mist hover:text-snow" href="/skills">AI Skills</Link>
            <Link className="text-mist hover:text-snow" href="/videos">Videos</Link>
            <Link className="text-mist hover:text-snow" href="/lab">The Lab</Link>
            <Link className="text-mist hover:text-snow" href="/store">Store</Link>
            <Link className="text-mist hover:text-snow" href="/links">Links</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-mist">Elsewhere</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <a className="text-mist hover:text-snow" href="https://github.com/ibrews" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="text-mist hover:text-snow" href="https://linkedin.com/in/alexcoulombe" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a className="text-mist hover:text-snow" href="https://twitter.com/ibrews" target="_blank" rel="noopener noreferrer">X / @ibrews</a>
            <a className="text-mist hover:text-snow" href="https://agilelens.com" target="_blank" rel="noopener noreferrer">Agile Lens</a>
            <a className="text-mist hover:text-snow" href="https://uepodcast.com" target="_blank" rel="noopener noreferrer">UE Podcast</a>
            <a className="text-mist hover:text-snow" href="https://agilelens.com/unrealnyc" target="_blank" rel="noopener noreferrer">Unreal NYC</a>
            <a className="text-mist hover:text-snow" href="https://youtube.com/user/ibrews" target="_blank" rel="noopener noreferrer">YouTube</a>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center font-mono text-xs text-mist">
        © {new Date().getFullYear()} Alex Coulombe · built with an AI co-pilot, naturally · try the Konami code
      </div>
    </footer>
  );
}
