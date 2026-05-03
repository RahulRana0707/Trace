import { Geist_Mono, Figtree } from "next/font/google"

import "@trace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@trace/ui/lib/utils"

import { Toaster } from "@trace/ui/components/sonner"
import { TooltipProvider } from "@trace/ui/components/tooltip"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
