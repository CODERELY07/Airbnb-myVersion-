import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// User photo, or initials when there is none (no third-party placeholder image)
export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  const base = "size-9 shrink-0 rounded-full object-cover ring-1 ring-black/5";

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? "User"} referrerPolicy="no-referrer" className={cn(base, className)} />;
  }

  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className={cn(base, "grid place-items-center bg-muted text-xs font-semibold text-muted-foreground", className)}
    >
      {initials || <UserRound className="size-[55%]" strokeWidth={2} />}
    </span>
  );
}
