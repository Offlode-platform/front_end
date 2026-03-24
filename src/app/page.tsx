import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-synapse-fg">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-12 sm:items-start">
        <Image
          className="opacity-90 invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-synapse-fg-heading">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-synapse-fg/80">
            Global styles follow the Synapse architecture palette (see{" "}
            <Link
              href="/synapse-architecture-diagram.html"
              className="font-medium text-synapse-cyan underline-offset-4 hover:underline"
            >
              architecture diagram
            </Link>
            ). Use Tailwind tokens such as{" "}
            <code className="synapse-mono rounded bg-white/5 px-1.5 py-0.5 text-sm text-synapse-gold">
              text-synapse-cyan
            </code>{" "}
            or CSS classes like{" "}
            <code className="synapse-mono rounded bg-white/5 px-1.5 py-0.5 text-sm text-synapse-gold">
              synapse-tag
            </code>
            .
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-synapse-teal px-5 text-synapse-fg-heading transition-colors hover:bg-synapse-teal-mid md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-synapse-border-subtle bg-white/5 px-5 text-synapse-fg transition-colors hover:bg-white/10 md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
