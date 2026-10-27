"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function Counter({
  name,
  label,
  defaultValue = 1,
  min = 1,
  max = 20,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  min?: number;
  max?: number;
}) {
  const [amount, setAmount] = useState(Math.min(max, Math.max(min, defaultValue)));

  const buttonClass =
    "grid size-9 place-items-center rounded-full border bg-card transition hover:border-foreground disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={amount} />
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        className={buttonClass}
        disabled={amount <= min}
        onClick={() => setAmount((a) => Math.max(min, a - 1))}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-6 text-center text-base tabular-nums" aria-live="polite">
        {amount}
      </span>
      <button
        type="button"
        aria-label={`More ${label}`}
        className={buttonClass}
        disabled={amount >= max}
        onClick={() => setAmount((a) => Math.min(max, a + 1))}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
