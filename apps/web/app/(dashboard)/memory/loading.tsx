import { Skeleton } from "@trace/ui/components/skeleton"

export default function MemoryLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full max-w-md" />
      </div>

      <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/10">
        <div className="grid grid-cols-12 gap-3 border-b bg-muted/20 px-4 py-3">
          <Skeleton className="col-span-12 h-4 w-24 md:col-span-3" />
          <Skeleton className="col-span-12 h-4 w-40 md:col-span-9 lg:col-span-5" />
          <Skeleton className="hidden h-4 w-56 xl:col-span-4 xl:block" />
          <Skeleton className="hidden h-4 w-24 lg:col-span-2 lg:block" />
          <Skeleton className="hidden h-4 w-28 md:col-span-2 md:block" />
        </div>

        <div className="divide-y">
          {["a", "b", "c", "d"].map((key) => (
            <div key={key} className="grid grid-cols-12 gap-3 px-4 py-4">
              <div className="col-span-12 space-y-2 md:col-span-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full max-w-[14rem]" />
              </div>
              <div className="col-span-12 space-y-2 md:col-span-9 lg:col-span-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12 lg:hidden" />
              </div>
              <div className="hidden space-y-2 xl:col-span-4 xl:block">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="hidden lg:col-span-2 lg:block">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="hidden md:col-span-2 md:block">
                <Skeleton className="h-4 w-full max-w-[12rem]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
