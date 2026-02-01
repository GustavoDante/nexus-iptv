import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[200px] w-full rounded-xl bg-zinc-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-zinc-800" />
            <Skeleton className="h-4 w-[200px] bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
