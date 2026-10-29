import Link from "next/link";
import { SearchX, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = SearchX,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 font-display text-xl font-medium">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && (
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
