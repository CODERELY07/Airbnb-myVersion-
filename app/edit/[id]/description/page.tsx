import { Counter } from "@/app/components/Counter";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOwnListing, updateListingDescription } from "@/lib/supabase/listings";
import { redirect } from "next/navigation";

export default async function EditDescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch only this listing, and only if you own it
  const listing = await getOwnListing(id);

  if (!listing) {
    return redirect("/my-listings");
  }

  return (
    <>
      <div className="w-11/12 mt-4 sm:w-4/5 lg:w-3/5 mx-auto px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight transition-colors">
          Update your home description
        </h2>
      </div>

      <form action={updateListingDescription}>
        <input type="hidden" name="listingId" value={id} />
        <div className="mx-auto w-11/12 sm:w-4/5 lg:w-3/5 mt-6 sm:mt-10 flex flex-col gap-y-4 sm:gap-y-5 mb-24 sm:mb-36 px-4 sm:px-0">
          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Title</Label>
            <Input
              name="title"
              type="text"
              required
              defaultValue={listing.title as string}
              placeholder="Short and simple..."
              className="text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Description</Label>
            <Textarea
              name="description"
              required
              defaultValue={listing.description as string}
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
              defaultValue={listing.price as number}
              placeholder="Price per Night in USD"
              min={10}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label className="text-sm sm:text-base">Image (Leave empty to keep current image)</Label>
            <Input 
              name="image" 
              type="file" 
              className="text-sm sm:text-base cursor-pointer"
            />
            {listing.photo && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Current image: {listing.photo}
              </p>
            )}
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
                <Counter name="guest" defaultValue={Number(listing.guests)} />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-3 sm:gap-0">
                <div className="flex flex-col">
                  <h3 className="underline font-medium text-sm sm:text-base">Bedrooms</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    How many Bedrooms do you have?
                  </p>
                </div>
                <Counter name="bedroom" defaultValue={Number(listing.bedrooms)} />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-3 sm:gap-0">
                <div className="flex flex-col">
                  <h3 className="underline font-medium text-sm sm:text-base">Bathrooms</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    How many bathrooms do you have?
                  </p>
                </div>
                <Counter name="bathroom" defaultValue={Number(listing.bathrooms)} />
              </div>
            </CardHeader>
          </Card>
        </div>

        <CreationBottomBar />
      </form>
    </>
  );
}