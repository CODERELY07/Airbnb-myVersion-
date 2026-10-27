import type { ReactNode } from "react";

// Title block used at the top of every page
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
