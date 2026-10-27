"use client";

import { useState } from "react";
import { categoryItems } from "../lib/categoryItems";
import { cn } from "@/lib/utils";

export function SelectedCategory({ defaultCategory }: { defaultCategory?: string }) {
  const [selected, setSelected] = useState(defaultCategory ?? "");

  return (
    <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <input type="hidden" name="categoryName" value={selected} />

      {categoryItems.map(({ id, name, title, icon: Icon }) => {
        const isSelected = selected === name;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setSelected(name)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected ? "border-foreground shadow-[inset_0_0_0_1px_var(--foreground)]" : "hover:border-foreground/40"
            )}
          >
            <Icon className="size-6" strokeWidth={1.5} />
            <span className="text-sm font-medium">{title}</span>
          </button>
        );
      })}
    </div>
  );
}
