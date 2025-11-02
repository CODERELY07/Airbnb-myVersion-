"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { categoryItems } from "../lib/categoryItems";
import Image from "next/image";
import { useState } from "react";

export function SelectedCategory({defaultCategory} : {defaultCategory?: string}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory || "");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mt-6 sm:mt-10 w-11/12 sm:w-4/5 lg:w-3/5 mx-auto mb-24 sm:mb-36 px-4 sm:px-0">
    
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
              <CardHeader className="flex flex-col items-center space-y-1 sm:space-y-2 p-3 sm:p-4 lg:p-6">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  height={32}
                  width={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                />
                <h3 className="font-medium text-xs sm:text-sm lg:text-base text-center">{item.title}</h3>
              </CardHeader>
            </Card>
          </button>
        );
      })}
    </div>
  );
}