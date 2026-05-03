import {
  Card,
  CardContent,
  CardHeader,
} from "@trace/ui/components/card"
import { Skeleton } from "@trace/ui/components/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-9 w-[5.5rem] rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c", "d"].map((key) => (
          <li key={key}>
            <Card className="overflow-hidden pt-0">
              <Skeleton className="h-24 w-full rounded-none rounded-t-xl" />
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-3/5 max-w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 pt-0">
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
