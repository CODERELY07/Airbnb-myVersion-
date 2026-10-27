import type { ReactNode } from "react";

// Heading for each step of the create / edit flow
export function StepHeader({
  step,
  title,
  description,
  error,
}: {
  step: 1 | 2 | 3;
  title: string;
  description?: string;
  error?: ReactNode;
}) {
  return (
    <div className="mb-8 sm:mb-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {step} of 3</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>}
      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
