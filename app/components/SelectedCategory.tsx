"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { categoryItems } from "../lib/categoryItems";
import Image from "next/image";
import { useState } from "react";

export function SelectedCategory() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  return (
    <div className="grid grid-cols-4 gap-8 mt-10 w-3/5 mx-auto mb-36">
    
      <input
        type="hidden"
        name="categoryName"
        value={selectedCategory}
      />

      {categoryItems.map((item) => {
        const isSelected = selectedCategory === item.name;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedCategory(item.name)}
            className={`cursor-pointer text-left rounded-md border transition-all ${
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "border-muted"
            }`}
          >
            <Card>
              <CardHeader className="flex flex-col items-center space-y-2">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  height={32}
                  width={32}
                  className="w-8 h-8"
                />
                <h3 className="font-medium">{item.title}</h3>
              </CardHeader>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
