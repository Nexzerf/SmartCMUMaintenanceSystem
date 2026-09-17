import { ListSkeleton, Skeleton } from "./Skeleton";

export function MobileListSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <div className="space-y-5 px-5 pt-6" aria-busy aria-label="กำลังโหลด">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      {hero ? <Skeleton className="h-36 w-full rounded-[20px]" /> : <Skeleton className="h-11 w-full rounded-[12px]" />}
      <ListSkeleton rows={4} />
    </div>
  );
}

export function MobileDetailSkeleton() {
  return (
    <div className="space-y-5 px-5 pt-6" aria-busy aria-label="กำลังโหลด">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32 w-full rounded-[20px]" />
      <Skeleton className="h-72 w-full rounded-[16px]" />
      <Skeleton className="h-40 w-full rounded-[16px]" />
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6 md:px-8" aria-busy aria-label="กำลังโหลด">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-11 w-80 max-w-full rounded-[12px]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[16px]" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-[16px]" />
    </div>
  );
}
