import { createTRPCRouter } from "../init";
import { browseProcedures } from "./listings/browse";
import { favoriteProcedures } from "./listings/favorites";
import { manageProcedures } from "./listings/manage";
import { reservationProcedures } from "./listings/reservations";

// Everything under trpc.listings.*, split by topic into ./listings/
export const listingsRouter = createTRPCRouter({
  ...browseProcedures,
  ...favoriteProcedures,
  ...reservationProcedures,
  ...manageProcedures,
});
