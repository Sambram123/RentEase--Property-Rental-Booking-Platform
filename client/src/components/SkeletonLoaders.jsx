/**
 * SkeletonLoader — reusable animated skeleton placeholders
 */

// Base skeleton block
export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

// Property card skeleton
export const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
    <SkeletonBlock className="h-52 w-full rounded-none" />
    <div className="space-y-2 p-4">
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Property grid skeleton
export const PropertyGridSkeleton = ({ count = 6 }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <PropertyCardSkeleton key={i} />
    ))}
  </div>
);

// List row skeleton
export const ListRowSkeleton = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
        <SkeletonBlock className="h-8 w-16 rounded-lg" />
      </div>
    ))}
  </div>
);

// Dashboard stats skeleton
export const StatsSkeleton = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <SkeletonBlock className="mb-3 h-10 w-10 rounded-xl" />
        <SkeletonBlock className="mb-2 h-6 w-16" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
    ))}
  </div>
);

// Notification skeleton
export const NotificationSkeleton = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4">
        <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-3/4" />
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

// Chat conversation skeleton
export const ConversationSkeleton = ({ count = 5 }) => (
  <div className="space-y-1">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3">
        <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3 w-10" />
          </div>
          <SkeletonBlock className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Page-level loading skeleton
export const PageSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <SkeletonBlock className="mb-6 h-8 w-48" />
    <StatsSkeleton />
    <div className="mt-8">
      <SkeletonBlock className="mb-4 h-6 w-32" />
      <PropertyGridSkeleton count={3} />
    </div>
  </div>
);

export default SkeletonBlock;
