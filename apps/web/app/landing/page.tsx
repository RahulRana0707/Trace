import Image from "next/image"
import Link from "next/link"

import landingBg from "@trace/ui/public/landing-bg.png"
import { TraceLogo } from "@trace/ui/components/logo"
import { Button } from "@trace/ui/components/button"
import { cn } from "@trace/ui/lib/utils"

export default function LandingPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Image
        src={landingBg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        placeholder="blur"
      />
      {/* Base vignette + cool/teal wash so UI matches product tokens (not warm-only photo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-primary/18 mix-blend-soft-light"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-black/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-[ellipse_120%_70%_at_50%_-10%] from-primary/25 via-transparent to-transparent"
      />

      <header className="pointer-events-none fixed inset-x-4 top-5 z-20 sm:inset-x-6 sm:top-6">
        <nav
          aria-label="Primary"
          className={cn(
            "trace-landing-nav-in pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-white/15",
            "bg-black/30 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur-md",
            "supports-backdrop-filter:bg-black/25"
          )}
        >
          <Link
            href="/landing"
            className="flex items-center gap-2 rounded-full px-1 py-0.5 text-white ring-offset-2 ring-offset-transparent transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/80"
          >
            <TraceLogo
              variant="light"
              showText={false}
              size={28}
              className="size-7 shrink-0"
            />
            <span className="font-heading text-sm font-semibold tracking-tight">
              trace
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="shadow-sm" asChild>
              <Link href="/">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-28 pb-12 text-center sm:px-10 sm:pt-32 lg:px-16 lg:pt-28">
        <div className="trace-landing-hero-in flex max-w-3xl flex-col items-center gap-5 text-pretty text-white lg:max-w-4xl">
          <p className="text-xs font-medium tracking-[0.2em] text-white/70 uppercase">
            Agent memory
          </p>
          <h1 className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI agents finally have memory.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            trace stores the reasoning behind your work—intent, tradeoffs, and
            architecture—so when your agent comes back weeks later, it pulls
            real context instead of guessing.
          </p>
          <p className="max-w-xl text-sm font-medium text-white/75">
            Git remembers what. trace remembers why.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" className="shadow-md" asChild>
              <Link href="/">Get started</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
