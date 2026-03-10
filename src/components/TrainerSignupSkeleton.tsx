import { Skeleton } from "@/components/ui/skeleton";

const TrainerSignupSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Left Panel Skeleton - Desktop */}
    <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 z-10">
      <div className="max-w-md w-full space-y-6">
        <Skeleton className="h-10 w-40 bg-primary-foreground/10" />
        <Skeleton className="h-8 w-3/4 bg-primary-foreground/10" />
        <Skeleton className="h-4 w-full bg-primary-foreground/5" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-primary-foreground/10" />
              <Skeleton className="h-4 w-32 bg-primary-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Right Panel Skeleton */}
    <div className="lg:ml-[40%] flex-1 flex items-start justify-center p-6 lg:p-12 min-h-screen">
      <div className="w-full max-w-lg py-8 space-y-6">
        {/* Mobile progress bar */}
        <div className="lg:hidden space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-40" />
        </div>

        {/* Title */}
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />

        {/* Google button */}
        <Skeleton className="h-11 w-full rounded-md" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-px flex-1" />
        </div>

        {/* Photo circles */}
        <div className="flex gap-6 justify-center">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
        </div>

        {/* Form field rows */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-[70px] w-full rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-8" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-4">
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

/** Inline skeleton for step content while lazy loading */
export const StepLoadingSkeleton = () => (
  <div className="mt-6 space-y-5 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    ))}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </div>
  </div>
);

export default TrainerSignupSkeleton;
