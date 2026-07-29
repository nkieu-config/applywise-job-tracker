import { LoadingScreen } from "@/components/ui/loading-screen";

const COLUMN_CARDS = [3, 2, 2, 1];

export default function Loading() {
  return (
    <LoadingScreen label="Loading your applications" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-9 w-48 animate-pulse rounded bg-hairline" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-hairline" />
          <div className="h-11 w-40 animate-pulse rounded-lg bg-hairline" />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 lg:overflow-x-auto lg:pb-1">
        {COLUMN_CARDS.map((count, col) => (
          <div
            key={col}
            className="flex w-full shrink-0 flex-col gap-2 lg:w-60"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-hairline" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-hairline"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-hairline" />
    </LoadingScreen>
  );
}
