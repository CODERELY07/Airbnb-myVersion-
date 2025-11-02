import { Counter } from "@/app/components/Counter";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDescription } from "@/lib/supabase/listings";

export default async function DescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params; 
  const { error } = await searchParams;

  return (
    <>
      <div className="w-11/12 sm:w-4/5 lg:w-3/5 mx-auto px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight transition-colors">
          Please describe your home as good as you can!
        </h2>

        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs sm:text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      <form action={createDescription}>
        <input type="hidden" name="listingId" value={id} />
        <div className="mx-auto w-11/12 sm:w-4/5 lg:w-3/5 mt-6 sm:mt-10 flex flex-col gap-y-4 sm:gap-y-5 mb-24 sm:mb-36 px-4 sm:px-0">
          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Title</Label>
            <Input
              name="title"
              type="text"
              required
              placeholder="Short and simple..."
              className="text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Description</Label>
            <Textarea
              name="description"
              required
              placeholder="Please describe your home..."
              className="text-sm sm:text-base min-h-[100px] sm:min-h-[120px]"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Price</Label>
            <Input
              name="price"
              type="number"
              required
              placeholder="Price per Night in USD"
              min={10}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Image</Label>
            <Input 
              name="image" 
              type="file" 
              accept="image/*" 
              required 
              className="text-sm sm:text-base cursor-pointer"
            />
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-y-4 sm:gap-y-5 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-3 sm:gap-0">
                <div className="flex flex-col">
                  <h3 className="underline font-medium text-sm sm:text-base">Guests</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    How many guests do you want?
                  </p>
                </div>
                <Counter name="guest" defaultValue={0} />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-3 sm:gap-0">
                <div className="flex flex-col">
                  <h3 className="underline font-medium text-sm sm:text-base">Bedrooms</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    How many Bedrooms do you have?
                  </p>
                </div>
                <Counter name="bedroom" defaultValue={0} />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-3 sm:gap-0">
                <div className="flex flex-col">
                  <h3 className="underline font-medium text-sm sm:text-base">Bathrooms</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    How many bathrooms do you have?
                  </p>
                </div>
                <Counter name="bathroom" defaultValue={0} />
              </div>
            </CardHeader>
          </Card>
        </div>

        <CreationBottomBar />
      </form>
    </>
  );
}