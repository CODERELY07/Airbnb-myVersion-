import { Counter } from "@/app/components/Counter";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateListingDescription } from "@/lib/supabase/listings";
import { serverCaller } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function EditDescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch existing listing data
  const listings = await serverCaller.listings.fetchListings({});
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return redirect("/my-homes");
  }

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          Update your home description
        </h2>
      </div>

      <form action={updateListingDescription}>
        <input type="hidden" name="listingId" value={id} />
        <div className="mx-auto w-3/5 mt-10 flex flex-col gap-y-5 mb-36">
          <div className="flex flex-col gap-y-2">
            <Label>Title</Label>
            <Input
              name="title"
              type="text"
              required
              defaultValue={listing.title as string}
              placeholder="Short and simple..."
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              required
              defaultValue={listing.description as string}
              placeholder="Please describe your home..."
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Price</Label>
            <Input
              name="price"
              type="number"
              required
              defaultValue={listing.price as number}
              placeholder="Price per Night in USD"
              min={10}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Image (Leave empty to keep current image)</Label>
            <Input name="image" type="file" />
            {listing.photo && (
              <p className="text-sm text-muted-foreground">
                Current image: {listing.photo}
              </p>
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-y-5">
              <div className="flex items-center w-full justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Guests</h3>
                  <p className="text-muted-foreground text-sm">
                    How many guests do you want?
                  </p>
                </div>
                <Counter name="guest" defaultValue={Number(listing.guests)} />
              </div>
              <div className="flex items-center w-full justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Bedrooms</h3>
                  <p className="text-muted-foreground text-sm">
                    How many Bedrooms do you have?
                  </p>
                </div>
                <Counter name="bedroom" defaultValue={Number(listing.bedrooms)} />
              </div>
              <div className="flex items-center w-full justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Bathrooms</h3>
                  <p className="text-muted-foreground text-sm">
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