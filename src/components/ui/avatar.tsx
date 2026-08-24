import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  const initials = (name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? "Avatar"} className={cn("h-10 w-10 rounded-full object-cover", className)} />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-medium text-cream",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
