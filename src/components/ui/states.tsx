import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-blush">{icon}</div> : null}
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-paper", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-10 w-48" />
      <LoadingSkeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-32" />
      </div>
    </div>
  );
}
