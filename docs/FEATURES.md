# Features Guide

For each feature: what it does, how it works, and the files involved.
The second half has step-by-step recipes for adding new features.

For setup, see the [README](../README.md). For the database, security and API reference, see [DOCUMENTATION.md](DOCUMENTATION.md).

## Contents

**Features**
1. [Sign in (Google, demo accounts, sign out)](#1-sign-in)
2. [Browse and categories](#2-browse-and-categories)
3. [Search](#3-search)
4. [Listing page](#4-listing-page)
5. [Favorites](#5-favorites)
6. [Create a listing (3 steps)](#6-create-a-listing)
7. [Edit and delete a listing](#7-edit-and-delete-a-listing)
8. [Booking and GCash payment](#8-booking-and-gcash-payment)
9. [Reservations page](#9-reservations-page)
10. [Demo accounts and demo listings](#10-demo-accounts-and-demo-listings)
11. [Layout, design and shared UI](#11-layout-design-and-shared-ui)

**How to add things**
- [A. Add a new category](#a-add-a-new-category)
- [B. Add a new field to listings](#b-add-a-new-field-to-listings)
- [C. Add a new page](#c-add-a-new-page)
- [D. Add a new tRPC query or mutation](#d-add-a-new-trpc-query-or-mutation)
- [E. Add a new form with a Server Action](#e-add-a-new-form-with-a-server-action)
- [F. Add a new database table](#f-add-a-new-database-table)
- [G. Add a new environment variable](#g-add-a-new-environment-variable)
- [H. Change colors, fonts or spacing](#h-change-colors-fonts-or-spacing)
- [I. Add or change demo data](#i-add-or-change-demo-data)
- [Checklist before you push](#checklist-before-you-push)

---

## How data moves (read this first)

There are three ways the app reads and writes data. Every feature uses one or more of them.

| Way | Used by | Example |
|---|---|---|
| **Server Component → `serverCaller`** | Pages that load data | `app/page.tsx` calls `serverCaller.listings.fetchListings()` |
| **Client Component → `trpc.*.useQuery / useMutation`** | Interactive parts in the browser | the calendar loads booked dates with `trpc.listings.fetchReservation.useQuery()` |
| **`<form action={serverAction}>`** | Forms | the create steps post to `createDescription` in `lib/supabase/listings.ts` |

All three end up in `trpc/routers/listings.ts`, which talks to Supabase as the logged-in user.
**Row Level Security** (`supabase/schema.sql`) decides what each user may read or change.

```
page.tsx / component  ──►  lib/supabase/listings.ts (Server Action)  ──►  trpc/routers/listings.ts  ──►  Supabase
                     └────────────── serverCaller / trpc hooks ──────────────┘
```

---

## 1. Sign in

**What it does:** sign in with Google, or one click as *Demo Host* / *Demo Guest*. Sign out from the menu.

**How it works**
1. The menu (`NavUser`) opens the login popup (`AuthForm`).
2. **Google:** `signInWithGoogle()` → Google → Supabase → `/auth/callback` saves the session cookie.
3. **Demo:** `signInAsDemo(role)` signs in with the email from `lib/demoAccounts.json` and the password from `DEMO_ACCOUNT_PASSWORD` (server only).
4. `proxy.ts` refreshes the session cookie on every request.
5. A database trigger copies every new user into `public.users` (name and avatar for "Hosted by").

| File | Role |
|---|---|
| `app/components/NavUser.tsx` | Account menu: login, list your home, my pages, sign out |
| `app/components/Auth/AuthForm.tsx` | Login popup (Google + demo buttons) |
| `app/components/Auth/action.ts` | Server Actions: `signInWithGoogle`, `signInAsDemo`, `signOut` |
| `app/auth/callback/route.ts` | Finishes the Google login |
| `lib/supabase/auth.ts` | `getClientUserProfile()` returns the logged-in user (or `null`) |
| `lib/demoAccounts.json` | Demo account emails and labels (no passwords) |
| `proxy.ts`, `utils/supabase/middleware.ts` | Session refresh on every request |
| `utils/supabase/server.ts`, `client.ts` | Supabase clients for server and browser |
| `supabase/schema.sql` | `users` table and the `handle_new_user` trigger |

**Setup:** Google login needs a Google Cloud OAuth client and the Supabase Google provider.
See [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md).

**Protecting a page:** call `getClientUserProfile()` at the top and `redirect("/")` if it returns `null` (see `app/favorites/page.tsx`).

---

## 2. Browse and categories

**What it does:** the home page shows all finished listings. The category bar filters them (`/?filter=beach`).

**How it works:** `app/page.tsx` reads `?filter=` and calls `fetchListings`, which only returns listings where all three create steps are done (`addedCategory`, `addedDescription`, `addedLocation`).

| File | Role |
|---|---|
| `app/page.tsx` | Home page, heading and grid |
| `app/components/MapFilterItems.tsx` | Category bar (links to `/?filter=…`) |
| `app/lib/categoryItems.ts` | The list of categories: name, title, description, icon |
| `app/components/ListingGrid.tsx` | Responsive grid and loading skeleton |
| `app/components/ListingCard.tsx` | Card with the favorite heart |
| `app/components/ListingCardShell.tsx` | The card's look (photo, title, location, price) |
| `app/lib/locaitonHelpers.ts` | `getListingLocation()` turns codes into "El Nido, Palawan" (server only) |
| `trpc/routers/listings.ts` | `fetchListings` |

To add a category, see [recipe A](#a-add-a-new-category).

---

## 3. Search

**What it does:** search by province, dates and number of guests, bedrooms and bathrooms. Listings that are already booked for those dates are hidden.

**How it works**
1. `SearchBar` builds a URL: `/search?destination=053&checkIn=2026-11-10&checkOut=2026-11-13&guests=2`.
2. `app/search/page.tsx` calls `searchListings`.
3. `searchListings` filters listings, then removes any listing with an overlapping reservation in the public `reservation_dates` view.
4. The province list in the search box comes from `location.listUnique` (only provinces that have listings).

| File | Role |
|---|---|
| `app/components/SearchBar.tsx` | Where / When / Who bar with popups |
| `app/components/StayCalendar.tsx` | Date range picker (shared with the listing page) |
| `app/search/page.tsx` | Results page |
| `trpc/routers/listings.ts` | `searchListings`, `location.listUnique` |
| `lib/utils.ts` | `activeReservationFilter()`: which reservations still block dates |

---

## 4. Listing page

**What it does:** shows the photo, details, host, category, description, availability calendar, address and booking card.

**How it works:** `app/listings/[id]/page.tsx` (server) loads the listing and host and turns the address codes into names **on the server**, so the big location database never reaches the browser. It then renders `ListingClient` (browser), which loads the booked dates and holds the selected dates.

| File | Role |
|---|---|
| `app/listings/[id]/page.tsx` | Loads the data, works out the address, checks if payments are on |
| `app/components/ListingClient.tsx` | The page layout, calendar and mobile price bar |
| `app/components/ReservationCard.tsx` | Price, dates, total and the Reserve button |
| `app/components/StayCalendar.tsx` | Calendar with booked dates disabled |
| `app/components/Avatar.tsx` | Host photo, or initials |
| `app/lib/locaitonHelpers.ts` | `getListingAddress()` |
| `trpc/routers/listings.ts` | `getListingData`, `fetchReservation` |

---

## 5. Favorites

**What it does:** the heart on a card saves or removes a listing. `/favorites` lists saved stays.

**How it works:** the heart is a small `<form>` that posts to `addToFavorite` or `deleteFromFavorite`, which then refresh the page (`revalidatePath`). RLS makes favorites private, so `favorites(*)` in a query only returns *your* favorite.

| File | Role |
|---|---|
| `app/components/ListingCard.tsx` | Heart form |
| `app/components/SubmitButtons.tsx` | `FavoriteButton` (shows a spinner while saving) |
| `lib/supabase/listings.ts` | `addToFavorite`, `deleteFromFavorite` |
| `trpc/routers/listings.ts` | `addToFavorite`, `removeFromFavorite`, `fetchFavListings` |
| `app/favorites/page.tsx`, `loading.tsx` | Favorites page |

---

## 6. Create a listing

**What it does:** "List your home" walks through 3 steps: category → details and photo → address.

**How it works**
1. `NavUser` calls `createListing.createListing`. It reuses your unfinished draft or creates an empty row, then opens the right step.
2. **Step 1** `/create/[id]/structure` → `createCategoryAction` saves `categoryName` and sets `addedCategory`.
3. **Step 2** `/create/[id]/description` → `createDescription` uploads the photo to the `images` bucket (`<listingId>/<time>-<name>`) and saves the details.
4. **Step 3** `/create/[id]/address` → `createLocation` saves the region, province, city and barangay codes, then goes home.

| File | Role |
|---|---|
| `app/create/layout.tsx` | Narrow page column |
| `app/create/[id]/structure/page.tsx` + `app/components/StructureForm.tsx` | Step 1 |
| `app/create/[id]/description/page.tsx` | Step 2 |
| `app/create/[id]/address/page.tsx` | Step 3 |
| `app/components/SelectedCategory.tsx` | Category tiles |
| `app/components/DescriptionFields.tsx` | Title, description, price, photo, counters (shared with edit) |
| `app/components/AddressFields.tsx` | Region → province → city → barangay pickers (shared with edit) |
| `app/components/Counter.tsx` | − / + counter |
| `app/components/StepHeader.tsx` | "Step X of 3" heading and error box |
| `app/components/CreationBottomBar.tsx` | Fixed footer: progress line, Cancel, Next |
| `lib/supabase/listings.ts` | `createCategoryAction`, `createDescription`, `createLocation` |
| `trpc/routers/listings.ts` | `createListing`, `createCategory`, `createDescription`, `createLocation` |

---

## 7. Edit and delete a listing

**What it does:** on **My listings**, each card has a "…" menu: *Edit listing* (same 3 steps, prefilled) or *Delete* (with a confirmation).

**How it works:** the edit pages call `getOwnListing(id)`, which returns the listing only if you own it (otherwise they redirect). Delete removes the photo from storage, then the row. Its favorites and reservations are deleted with it.

| File | Role |
|---|---|
| `app/my-listings/page.tsx`, `loading.tsx` | My listings page |
| `app/components/UpdateListingCard.tsx` | Card with the "…" menu and the delete dialog |
| `app/edit/layout.tsx` | Page column |
| `app/edit/[id]/structure/page.tsx` | Edit category |
| `app/edit/[id]/description/page.tsx` | Edit details (photo optional) |
| `app/edit/[id]/address/page.tsx` | Edit address (prefilled) |
| `lib/supabase/listings.ts` | `getOwnListing`, `updateListingCategory`, `updateListingDescription`, `updateListingLocation`, `deleteListing` |
| `trpc/routers/listings.ts` | `updateCategory`, `updateListing`, `updateLocation`, `deleteListing` |

---

## 8. Booking and GCash payment

**What it does:** pick dates → **Reserve with GCash** → pay on PayMongo → the booking is confirmed.

**How it works**
1. `ReservationCard` sends only `{ listingId, checkIn, checkOut }` as calendar days (`"2026-11-10"`) to `POST /api/payments`.
2. The server checks: logged in, not your own listing, valid dates (max 90 nights, not in the past), at most 2 unpaid bookings per guest, not already booked. Then it **calculates the price itself**, saves an unpaid reservation and creates a PayMongo GCash source.
3. The guest pays on GCash. **Two paths confirm it** (whichever comes first): PayMongo calls `/api/payments/webhook`, and the guest's browser returns to `/payment/success`, which calls `/api/payments/verify`. Both use `confirmReservationPayment()`: check the amount, charge once, set `isPaid = true`.
4. If someone else paid for the same dates a moment earlier, the database refuses the second booking and the payment is **refunded automatically**.
5. If they cancel, `/payment/failed` deletes the unpaid reservation.
6. An unpaid reservation only blocks the dates for **30 minutes** (`PENDING_PAYMENT_MINUTES`). The checkout day is free for the next guest's check-in.
7. **No PayMongo keys:** `isPaymentEnabled()` is false, the button is disabled and shows *"Online payment is not available right now."*

| File | Role |
|---|---|
| `app/components/ReservationCard.tsx` | Booking card and the button states |
| `app/api/payments/route.ts` | Validates, prices, creates the reservation and GCash source |
| `app/api/payments/verify/route.ts` | Guest returned: confirm the payment |
| `app/api/payments/webhook/route.ts` | PayMongo event: confirm the payment (signed) |
| `lib/paymongo.ts` | PayMongo client, `confirmReservationPayment`, `refundPayment`, webhook signature check |
| `app/payment/success/page.tsx`, `failed/page.tsx` | Return pages |
| `app/components/StatusCard.tsx` | Success / error card |
| `utils/supabase/admin.ts` | Service-role client (server only) |
| `lib/utils.ts` | `isPaymentEnabled`, `getNights`, `activeReservationFilter`, `PENDING_PAYMENT_MINUTES` |
| `supabase/schema.sql` | `reservation` table, `reservation_dates` view, RLS rules |

---

## 9. Reservations and guest bookings

**Hosts:** `/bookings` (menu → *Guest bookings*) lists paid bookings of your listings, upcoming and past,
with the guest's name, dates, nights and amount, plus the total booked.

| File | Role |
|---|---|
| `app/bookings/page.tsx`, `loading.tsx` | Host bookings page |
| `trpc/routers/listings.ts` | `getHostBookings` (host from the session, not from input) |
| `supabase/schema.sql` | `reservation_select_host` policy |

### Reservations page (guests)

**What it does:** `/reservations` lists your **paid** stays with their dates.

| File | Role |
|---|---|
| `app/reservations/page.tsx`, `loading.tsx` | The page |
| `lib/supabase/listings.ts` | `getReservationListings` |
| `trpc/routers/listings.ts` | `getReservationListings` (only `isPaid = true`) |

---

## 10. Demo accounts and demo listings

**What it does:** gives portfolio visitors two ready accounts and 13 listings with real photos.

```bash
npm run demo:accounts
```

```bash
npm run demo:listings
```

| File | Role |
|---|---|
| `lib/demoAccounts.json` | Demo emails, labels and descriptions |
| `scripts/create-demo-accounts.mjs` | Creates or resets the demo users (needs `DEMO_ACCOUNT_PASSWORD`) |
| `scripts/demo-listings.json` | The 13 listings: title, price, category, location codes, Unsplash photo id |
| `scripts/create-demo-listings.mjs` | Uploads the photos to `images/demo/` and recreates the demo listings |

Running `demo:listings` again replaces only listings whose photo is under `demo/`.

---

## 11. Layout, design and shared UI

| File | Role |
|---|---|
| `app/layout.tsx` | Fonts, header, `<main>` |
| `app/globals.css` | Colors, shadows, radius, `page-container` |
| `app/components/Navbar.tsx` | Sticky header: logo, search, account menu |
| `app/components/PageHeader.tsx` | Title and subtitle at the top of a page |
| `app/components/NoListings.tsx` | Empty state (icon, text, optional button) |
| `app/components/ListingGrid.tsx` | Grid, grid skeleton, page skeleton |
| `components/ui/*` | shadcn/ui building blocks (button, input, select, dialog, calendar…) |

The design tokens are listed in [DOCUMENTATION.md § 10](DOCUMENTATION.md#10-design-system).

---

# How to add things

## A. Add a new category

1. Open `app/lib/categoryItems.ts`.
2. Import an icon from [lucide-react](https://lucide.dev/icons) and add a row:
   ```ts
   import { TreePalm } from "lucide-react";
   { id: 13, name: "island", title: "Island", description: "On its own little island.", icon: TreePalm },
   ```
3. That's it. The category bar, the create and edit tiles, the listing page and the home heading all read from this list.

> Keep `name` stable once listings use it. It is stored in `listings.categoryName`.

## B. Add a new field to listings

Example: a `wifi` yes/no field.

1. **Database:** add to `supabase/schema.sql`, then run it in the SQL Editor:
   ```sql
   alter table public.listings add column if not exists wifi boolean not null default false;
   ```
2. **Form:** add an input in `app/components/DescriptionFields.tsx` (and read `defaults?.wifi` for editing):
   ```tsx
   <label className="flex items-center gap-2 text-sm">
     <input type="checkbox" name="wifi" defaultChecked={!!defaults?.wifi} /> Wi-Fi
   </label>
   ```
3. **Save it:** in `lib/supabase/listings.ts`, read `formData.get("wifi") === "on"` in `createDescription` and `updateListingDescription`, and pass it on.
4. **tRPC:** add `wifi: z.boolean()` to the input of `createDescription` and `updateListing` in `trpc/routers/listings.ts` and include it in the `.update({...})`.
5. **Show it:** add it to the `facts` list in `app/components/ListingClient.tsx`.
6. **Search (optional):** add a param in `SearchBar.tsx`, read it in `app/search/page.tsx`, filter in `searchListings`.

## C. Add a new page

1. Create `app/<name>/page.tsx`. Pages are Server Components by default:
   ```tsx
   import { redirect } from "next/navigation";
   import { getClientUserProfile } from "@/lib/supabase/auth";
   import { PageHeader } from "../components/PageHeader";

   export default async function MyPage() {
     const user = await getClientUserProfile();
     if (!user) return redirect("/"); // only if login is required

     return (
       <div className="page-container">
         <PageHeader title="My page" description="What this page is for." />
         {/* content */}
       </div>
     );
   }
   ```
2. Optional: add `app/<name>/loading.tsx` (for example `ListingPageSkeleton` from `ListingGrid.tsx`).
3. To link it from the account menu, add a row to `menuLinks` in `app/components/NavUser.tsx`.

## D. Add a new tRPC query or mutation

1. Add it to a router in `trpc/routers/listings.ts`:
   ```ts
   countListings: baseProcedure
     .input(z.object({ userId: z.string() }))
     .query(async ({ input }) => {
       const supabase = await createClient();
       const { count, error } = await supabase
         .from("listings")
         .select("id", { count: "exact", head: true })
         .eq("userId", input.userId);
       if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
       return count ?? 0;
     }),
   ```
2. Use it:
   - On the server: `await serverCaller.listings.countListings({ userId })`
   - In the browser: `trpc.listings.countListings.useQuery({ userId })`
3. A new router must also be added to `trpc/routers/_app.ts`.

> Never trust a `userId` sent from the browser for security. RLS protects the data, but when it matters, read the user on the server with `supabase.auth.getUser()`.

## E. Add a new form with a Server Action

1. Write the action in `lib/supabase/listings.ts` (the file starts with `"use server"`):
   ```ts
   export async function renameListing(formData: FormData) {
     const listingId = formData.get("listingId") as string;
     const title = (formData.get("title") as string)?.trim();
     if (!listingId || !title) throw new Error("Missing required fields");

     await serverCaller.listings.updateListing({ listingId, title });
     revalidatePath("/my-listings");
   }
   ```
2. Use it in a page or component:
   ```tsx
   <form action={renameListing}>
     <input type="hidden" name="listingId" value={id} />
     <Input name="title" required />
     <SubmitButtons label="Save" />
   </form>
   ```
   `SubmitButtons` shows a spinner while the form is saving.

## F. Add a new database table

1. Add the table to `supabase/schema.sql` with RLS. Copy the `favorites` block as a template:
   ```sql
   create table if not exists public.reviews (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     "userId" uuid not null references public.users (id) on delete cascade,
     "listingId" uuid not null references public.listings (id) on delete cascade,
     rating int not null check (rating between 1 and 5),
     body text
   );
   alter table public.reviews enable row level security;
   create policy "reviews_select_all" on public.reviews for select using (true);
   create policy "reviews_insert_own" on public.reviews
     for insert to authenticated with check (auth.uid() = "userId");
   ```
2. Run the file (or just the new part) in the Supabase SQL Editor.
3. Add procedures for it ([recipe D](#d-add-a-new-trpc-query-or-mutation)) and a UI.
4. Document it in `docs/DOCUMENTATION.md` § 3.

> **Always enable RLS.** Without a policy, nobody can read or write the table, which is the safe default.

## G. Add a new environment variable

1. Add it to `.env.local` (your machine) and `.env.example` (with a fake value and a comment).
2. Add it in **Vercel → Settings → Environment Variables**, then **redeploy**.
3. Only names starting with `NEXT_PUBLIC_` reach the browser. Keep secrets without that prefix and use them only in server files.
4. List it in the README's variables table and in `docs/DOCUMENTATION.md` § 8.

## H. Change colors, fonts or spacing

- **Colors:** edit the variables in `:root` in `app/globals.css` (`--primary` is the accent).
- **Shadows and radius:** the `@theme` block and `--radius` in the same file.
- **Fonts:** `app/layout.tsx` (`Geist` for text, `Fraunces` for headings via `font-display`).
- **Page width and gutters:** `@utility page-container` in `app/globals.css`.
- **Grid columns:** `gridClass` in `app/components/ListingGrid.tsx`.

## I. Add or change demo data

- **New demo listing:** add an entry to `scripts/demo-listings.json`.
  - `unsplash` is the photo id from an Unsplash URL (`images.unsplash.com/photo-<id>`).
  - Get location codes from `node_modules/@jobuntux/psgc/data/2025-2Q/*.json`.

  Then run `npm run demo:listings`.
- **New demo account:** add it to `lib/demoAccounts.json`, then run `npm run demo:accounts`. A button appears in the login popup automatically.

---

## Checklist before you push

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm run build
```

- [ ] Changed the database? Update `supabase/schema.sql` **and** run it in Supabase.
- [ ] New environment variable? Add it to `.env.example`, Vercel and the docs.
- [ ] New table? RLS is on and has policies.
- [ ] Tried it on a phone-sized screen (about 390px wide).
- [ ] Updated this file if you added or moved a feature.
