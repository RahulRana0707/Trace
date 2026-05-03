import type { Metadata } from "next"

import "./landing.css"

export const metadata: Metadata = {
  title: "trace — Your AI agents finally have memory",
  description:
    "Long-term memory for AI coding agents: capture why decisions were made, not just what changed in git.",
}

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative isolate flex min-h-dvh h-dvh w-full flex-col overflow-hidden bg-background">
      {children}
    </div>
  )
}
