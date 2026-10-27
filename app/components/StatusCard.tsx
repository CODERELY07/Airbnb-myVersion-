import type { ReactNode } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  loading: { icon: Loader2, ring: "bg-muted text-muted-foreground", spin: true },
  success: { icon: Check, ring: "bg-success/10 text-success", spin: false },
  error: { icon: X, ring: "bg-destructive/10 text-destructive", spin: false },
};

// Centered result card (payment success / failure)
export function StatusCard({
  tone,
  title,
  description,
  children,
}: {
  tone: keyof typeof tones;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const { icon: Icon, ring, spin } = tones[tone];

  return (
    <div className="page-container grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-md" role="status" aria-live="polite">
        <span className={cn("mx-auto grid size-14 place-items-center rounded-full", ring)}>
          <Icon className={cn("size-6", spin && "animate-spin")} strokeWidth={2.25} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {children && <div className="mt-6 grid gap-2">{children}</div>}
      </div>
    </div>
  );
}
