import { File } from "lucide-react";
interface ListingProps {
    title?: string,
    description?: string
}
export function NoListings({title, description} : ListingProps){
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md p-8 border text-center border-dashed animate-in fade-in-50 mt-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <File className="w-10 text-primary h-10"/>
            </div>
            <h2 className="mt-6 text-md font-medium">{title}</h2>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
    )
}