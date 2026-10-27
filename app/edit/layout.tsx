import type { ReactNode } from "react";

// Narrow column with room for the fixed bottom bar
export default function LayoutEdit({ children }: { children: ReactNode }) {
  return <div className="page-container max-w-3xl pb-16 pt-8 sm:pt-12">{children}</div>;
}
