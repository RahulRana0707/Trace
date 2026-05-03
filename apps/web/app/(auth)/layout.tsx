export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,oklch(0.967_0.001_286.375)_0%,transparent_45%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.274_0.006_286.033)_0%,transparent_45%)]">
      {children}
    </main>
  )
}
