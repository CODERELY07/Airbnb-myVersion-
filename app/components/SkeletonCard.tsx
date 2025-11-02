import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard(){
    return  (
        <div className="flex flex-col space-y-3 max-w-[220px] sm:max-w-[200px] lg:max-w-[240px]">
            <Skeleton className="aspect-square w-full rounded-xl"/>
            <div className="space-y-2 flex flex-col">
                <Skeleton className="h-4 w-full"/>
                <Skeleton className="h-4 w-3/4"/>
            </div>
        </div>
    )
}