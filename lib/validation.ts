import { z } from "zod";

// Rules for a listing's details. Used by the create/edit forms (Server Actions)
// and by the tRPC procedures, so bad values are rejected even if the browser check is bypassed.
export const listingDetailsSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(80, "Title is too long (max 80 characters)."),
  description: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters in the description.")
    .max(1000, "Description is too long (max 1000 characters)."),
  price: z.coerce
    .number()
    .int("Price must be a whole number.")
    .min(100, "Minimum price is ₱100 per night.")
    .max(1_000_000, "Price is too high."),
  guests: z.coerce.number().int().min(1, "At least 1 guest.").max(50, "Maximum 50 guests."),
  bedrooms: z.coerce.number().int().min(1, "At least 1 bedroom.").max(50, "Maximum 50 bedrooms."),
  bathrooms: z.coerce.number().int().min(1, "At least 1 bathroom.").max(50, "Maximum 50 bathrooms."),
});

export type ListingDetails = z.infer<typeof listingDetailsSchema>;

// Read the step 2 form (field names match DescriptionFields.tsx)
export function parseListingDetails(formData: FormData) {
  return listingDetailsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    guests: formData.get("guest"),
    bedrooms: formData.get("bedroom"),
    bathrooms: formData.get("bathroom"),
  });
}

export const firstError = (error: z.ZodError) => error.issues[0]?.message ?? "Please check the form.";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
