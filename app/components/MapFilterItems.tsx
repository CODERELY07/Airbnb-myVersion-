'use client'
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { categoryItems } from "../lib/categoryItems";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
    
export function MapFilterItems() {
  const searchParams = useSearchParams();
  const search = searchParams.get('filter');
  const pathname = usePathname();
//   try http://localhost:3000/?filter=hello
  console.log(search);

  const createQueryString = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);

    return params.toString();
  }, [searchParams]);


  return (
    <div className="flex gap-x-10 mt-5 overflow-x-scroll no-scrollbar">
      {categoryItems.map((item) => (
        <Link key={item.id} href={pathname + "?" + createQueryString('filter', item.name)} className={cn(search === item.name ? "border-b-2 border-black pb-2 " : "opacity-70 ", "flex-shrink-0 flex flex-col gap-y-3 items-center")}>
          <div className='relative w-6 h-6'>
            <Image
              src={item.imageUrl}
              alt='Category Image'
              className='w-6 h-6'
              width={24}
              height={24}
            />
          </div>
          <p className='text-xs font-medium'>{item.title}</p>
        </Link>
      ))}
    </div>
  );
}
