import { createTRPCRouter } from "../init";
import { createCategoryRouter, createListingRouter } from "./createListing";
import { listingsRouter } from "./listings";
import { locationRouter } from "./location";

// The whole API. Paths are used as trpc.<group>.<procedure>, e.g. trpc.listings.fetchListings
export const appRouter = createTRPCRouter({
  createListing: createListingRouter, // steps 2 and 3 of "List your home"
  createCategory: createCategoryRouter, // step 1
  listings: listingsRouter, // browse, favorites, bookings, edit, delete
  location: locationRouter, // provinces for the search box
});

export type AppRouter = typeof appRouter;
