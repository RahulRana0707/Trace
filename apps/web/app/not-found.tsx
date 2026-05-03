import Link from "next/link"

import { TraceLogo } from "@trace/ui/components/logo"
import { Button } from "@trace/ui/components/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <TraceLogo
          variant="brand"
          size={44}
          className="h-11 w-auto"
          showText={false}
        />

        <div className="space-y-2">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground">
            404
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The link may be broken, or the page may have been moved or removed.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If you believe this is a mistake, check the URL or contact support.
        </p>
      </div>
    </main>
  )
}
