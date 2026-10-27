import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubmitButtons } from "./SubmitButtons";

// Fixed footer for the create / edit steps, with a progress line
export function CreationBottomBar({
  step,
  cancelHref = "/",
  submitLabel,
}: {
  step: 1 | 2 | 3;
  cancelHref?: string;
  submitLabel?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card">
      <div className="h-1 bg-muted">
        <div className="h-full bg-foreground transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      <div className="page-container flex h-20 items-center justify-between">
        <Button variant="ghost" size="lg" className="rounded-full underline underline-offset-4" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButtons label={submitLabel ?? (step === 3 ? "Finish" : "Next")} />
      </div>
    </div>
  );
}
