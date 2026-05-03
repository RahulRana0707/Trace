import {
  Card,
  CardContent,
  CardHeader,
} from "@trace/ui/components/card"
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

      <Skeleton className="h-4 w-full max-w-md" />

      <ul className="flex flex-col gap-3">
        {["a", "b", "c"].map((key) => (
          <li key={key}>
            <Card>
              <CardHeader className="gap-2 pb-2">
                <Skeleton className="h-5 w-full max-w-2xl" />
                <Skeleton className="h-5 w-full max-w-xl" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
