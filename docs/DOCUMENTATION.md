# Project Documentation

How the Airbnb clone is put together. For setup steps, see the [README](../README.md).

## Contents

1. [Architecture](#1-architecture)
2. [Project structure](#2-project-structure)
3. [Database](#3-database)
4. [Main flows](#4-main-flows)
5. [tRPC API](#5-trpc-api)
6. [REST routes](#6-rest-routes)
7. [Security model](#7-security-model)
8. [Environment variables](#8-environment-variables)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Architecture

```
Browser
  │  React (client components)  ── tRPC hooks ──┐
  │  <form action={serverAction}>  ─────────────┤
  ▼                                             ▼
Next.js server  (Server Components, Server Actions, /api routes, tRPC router)
  │  Supabase client that carries the user's session cookie
  ▼
Supabase  ── Postgres (RLS) ── Auth (Google) ── Storage ("images" bucket)

/api/payments, /api/payments/verify  ──►  PayMongo API (GCash)
```

- **Server Components** load data with `serverCaller` (the tRPC router called on the server, with no HTTP request).
- **Client Components** use `trpc.*.useQuery / useMutation` through `/api/trpc`.
- **Forms** post to **Server Actions** in `lib/supabase/listings.ts`, which call the tRPC router.
- Every Supabase query runs as the logged-in user, so **Row Level Security** decides what each user can read or change.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) refreshes the Supabase session cookie on every request.

## 2. Project structure

```
app/
  page.tsx                    Home: listings by category
  search/page.tsx             Search results
  listings/[id]/page.tsx      Listing details, calendar, reserve button
  create/[id]/structure|description|address   3-step "Airbnb your home"
  edit/[id]/structure|description|address     Edit an owned listing
  my-listings/  favorites/  reservations/      User pages
  payment/success|failed      PayMongo redirect pages
  auth/callback/route.ts      Google OAuth code exchange
  api/payments/route.ts       Create reservation + PayMongo GCash source
  api/payments/verify/route.ts  Confirm payment, mark reservation paid
  api/trpc/[trpc]/route.ts    tRPC HTTP handler
  components/                 UI pieces. Shared building blocks:
                                ListingCardShell / ListingCard / UpdateListingCard, ListingGrid,
                                PageHeader, NoListings (empty state), StayCalendar (search + booking),
                                DescriptionFields + AddressFields (create & edit), StepHeader,
                                CreationBottomBar, StatusCard (payment pages), Avatar
  lib/                        Categories, countries, PSGC location helpers
components/
  ui/                         shadcn/ui components (calendar restyled: ink selection)
lib/
  supabase/auth.ts            getClientUserProfile()
  supabase/listings.ts        Server Actions (create, edit, delete, favorites)
  utils.ts                    cn(), BASE_URL, getImageUrl(), getNights(), isPaymentEnabled()
  demoAccounts.json           Demo account emails and labels (no passwords)
scripts/
  create-demo-accounts.mjs    Creates or resets the demo users
  create-demo-listings.mjs    Creates or resets the demo listings (photos from Unsplash)
  demo-listings.json          Demo listing data: title, price, category, PSGC codes, photo id
trpc/
  init.ts  server.tsx  client.tsx  query-client.ts
  routers/_app.ts             Root router
  routers/listings.ts         All listing, favorite and reservation procedures
utils/supabase/
  server.ts                   Server client (cookies)
  client.ts                   Browser client
  middleware.ts               Session refresh helper (used by proxy.ts)
  admin.ts                    Service-role client (server only, payments)
proxy.ts                      Runs on every request, refreshes the session
supabase/
  schema.sql                  Full database setup, paste into the SQL Editor
```

## 3. Database

All tables live in `public` and are created by `supabase/schema.sql`.
Column names are camelCase, so in raw SQL they need double quotes (`"userId"`).

### users
A public profile copied from `auth.users` by the `on_auth_user_created` trigger.

| column | type | note |
|---|---|---|
| id | uuid PK | same as `auth.users.id` |
| full_name | text | from Google |
| avatar_url | text | from Google |
| created_at | timestamptz | |

Email is **not** stored here, because anyone can read this table.

### listings

| column | type | note |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK → users | owner |
| user_id | uuid | copy of the owner id |
| categoryName | text | step 1 |
| addedCategory | bool | step 1 done |
| title, description | text | step 2 |
| price | numeric | per night, PHP |
| bedrooms, bathrooms, guests | int | step 2 |
| photo | text | path in the `images` bucket |
| addedDescription | bool | step 2 done |
| regionCode, provinceCode, munCityCode, barangayCode | text | step 3 (PSGC codes) |
| country | text | optional |
| addedLocation | bool | step 3 done |
| created_at | timestamptz | |

A listing appears publicly only when all three `added*` flags are `true`.

### favorites

| column | type | note |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK → users | |
| listingId | uuid FK → listings | cascade delete |
| | | unique (`userId`, `listingId`) |

### reservation

| column | type | note |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK → users | guest |
| listingId | uuid FK → listings | cascade delete |
| startDate, endDate | timestamptz | midnight Manila time (`manilaMidnight()`), end > start |
| nights | int | calculated on the server |
| totalPrice | numeric | calculated on the server |
| isPaid | bool | only the server can set it to true |
| paymentSourceId | text | PayMongo source id |
| paymentId | text | PayMongo payment id (for refunds) |

**No double bookings:** the constraint `reservation_no_overlapping_paid` makes it impossible for two
**paid** reservations of the same listing to overlap. Ranges are `[start, end)`, so the checkout day is
free for the next guest. Hosts can read the reservations of their own listings (`reservation_select_host`).

### reservation_dates (view)
Public, read-only: `listingId`, `startDate`, `endDate`, `isPaid`, `created_at`. Used by the calendar,
search and the double-booking check, so the `reservation` table itself can stay private.

### Storage
`images` is a public bucket with a 5 MB limit that accepts images only. Photo URL:
`{SUPABASE_URL}/storage/v1/object/public/images/{photo}` (see `getImageUrl()`).

## 4. Main flows

### Sign in
`AuthForm` → `signInWithGoogle()` (server action) → Google → Supabase →
`/auth/callback?code=…` → `exchangeCodeForSession` → redirect home.
The trigger creates the `public.users` row.

### Demo login
`AuthForm` → `signInAsDemo(role)` (server action) → `signInWithPassword` with the email from
`lib/demoAccounts.json` and the password from `DEMO_ACCOUNT_PASSWORD` → full page reload.
`npm run demo:accounts` (`scripts/create-demo-accounts.mjs`) creates or resets these users with the
service role key. If the password env is missing, the modal shows *"Demo accounts are not available right now."*

### Create a listing
1. **List your home** (`NavUser`) calls `createListing.createListing`. It reuses your last
   unfinished listing or inserts a new empty one, then sends you to the next step.
2. `/create/[id]/structure` → `createCategoryAction` sets `categoryName` and `addedCategory`.
3. `/create/[id]/description` → `createDescription` uploads the photo to storage and saves the details.
4. `/create/[id]/address` → `createLocation` saves the PSGC codes and `addedLocation`.

### Edit and delete
`/edit/[id]/*` pages load the listing with `getOwnListing()`, which redirects if you don't own it.
Delete is refused while the listing has **upcoming paid bookings**. Otherwise it removes the row, then the photo.
Listing fields are validated on the server by `lib/validation.ts` (title, description, ₱100+ price, 1–50 guests/rooms).

### Search
`SearchBar` → `/search?destination=&checkIn=&checkOut=&guests=&bedrooms=&bathrooms=` →
`listings.searchListings`. It filters finished listings by province and capacity, then
removes listings that have a reservation overlapping the dates (the overlap check runs in SQL).

### Book and pay (GCash)
```
ReservationCard ──POST /api/payments {listingId, checkIn: "2026-11-10", checkOut: "2026-11-13"}
   server: checks login → blocks booking your own listing → dates become Manila midnight
           → calculates nights and price from the DB → deletes your own earlier unpaid attempts
           → max 2 unpaid bookings per guest → overlap check (fails closed if it can't check)
           → inserts reservation (isPaid=false) → creates PayMongo GCash source
           → saves paymentSourceId → returns checkout_url
Browser ──► PayMongo GCash page (guest authorizes)
   ├─ PayMongo ──POST /api/payments/webhook  (event source.chargeable, signed)
   └─ success ─► /payment/success ──POST /api/payments/verify {reservationId}
        both call confirmReservationPayment() in lib/paymongo.ts:
          amount must match → charge the source (once, even if both run) → isPaid = true
          dates taken meanwhile? the DB refuses → automatic refund → guest sees why
   failed  ─► /payment/failed  → deletes the unpaid reservation
```

**Abandoned payments:** an unpaid reservation only holds its dates for 30 minutes
(`PENDING_PAYMENT_MINUTES` in `lib/utils.ts`). After that, the calendar, search and the overlap check
ignore it (`activeReservationFilter()`), so a guest who closes the GCash page doesn't block the listing.
The reservations page only shows paid bookings.

**Fallback:** `isPaymentEnabled()` in `lib/utils.ts` is true only when both
`PAYMONGO_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set. If not, the listing page disables
**Reserve** and shows *"Online payment is not available right now."*, and both payment routes return
`503` with the same message without creating a reservation.

## 5. tRPC API

Defined in `trpc/routers/listings.ts`, mounted in `trpc/routers/_app.ts`.

| Path | Type | Purpose |
|---|---|---|
| `createListing.createListing` | mutation | Start or resume a listing draft |
| `createListing.createDescription` | mutation | Save step 2 |
| `createListing.createLocation` | mutation | Save step 3 |
| `createCategory.createCategory` | mutation | Save step 1 |
| `listings.fetchListings` | query | Finished listings (optional category or owner filter) with favorites |
| `listings.fetchFavListings` | query | A user's favorites with their listing |
| `listings.getListingData` | query | One listing with its host |
| `listings.addToFavorite` / `removeFromFavorite` | mutation | Favorites |
| `listings.fetchReservation` | query | Booked date ranges for the calendar (paid, or pending under 30 min) |
| `listings.getReservationListings` | query | A user's paid reservations with their listing |
| `listings.searchListings` | query | Search with availability |
| `listings.updateListing` / `updateLocation` / `updateCategory` | mutation | Edit |
| `listings.deleteListing` | mutation | Delete a listing and its photo |
| `location.listUnique` | query | Provinces that have listings (search dropdown) |

## 6. REST routes

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/payments` | POST | `{ listingId, checkIn, checkOut }` | PayMongo source (`data.attributes.redirect.checkout_url`) |
| `/api/payments/verify` | POST | `{ reservationId }` | `{ success: true }`, or `402` not paid yet, `409` dates taken (refunded) |
| `/api/payments/webhook` | POST | PayMongo event (signed with `Paymongo-Signature`) | `{ received: true }`; `401` bad signature |
| `/auth/callback` | GET | `?code=&next=` | Redirect |

## 7. Security model

- **RLS on every table.** Listings and host profiles are public. Reservations are private to the guest;
  only booked dates are public, through the `reservation_dates` view (no guest id, no price).
  Only the owner can insert, update or delete their own rows. Favorites are private.
- **Reservations can't be marked paid from the browser.** There is no update policy, and inserts
  must have `isPaid = false`. Only `/api/payments/verify` (service role) sets `isPaid`, after PayMongo confirms.
- **The price is calculated on the server** from `listings.price` and the dates. The client only sends ids and dates.
- **Double booking is impossible:** an overlap check before inserting, and a database constraint
  that refuses two overlapping paid bookings (the losing payment is refunded automatically).
- **Webhook is signed:** `/api/payments/webhook` checks the HMAC-SHA256 `Paymongo-Signature` with
  `PAYMONGO_WEBHOOK_SECRET` and rejects anything older than 10 minutes.
- **Payments are idempotent:** the success page and the webhook can both run; the source is charged once,
  and the charged amount must equal the server-calculated price.
- **Holds are limited:** one guest can hold at most 2 unpaid bookings (30 minutes each).
- **Listing data is validated on the server** (`lib/validation.ts`), not just in the form.
- **The service role key** is only used in `utils/supabase/admin.ts`, which is marked `server-only`.
- **Uploads** are limited to images up to 5 MB by the storage bucket, and file names are sanitized (`safeFileName()`).
- **Open redirect protection:** `/auth/callback` only accepts relative `next` paths.
- **Input validation:** `/api/payments` validates the body with zod (uuid, real dates, no past check-in, max 90 nights).
- **No internal errors leak:** API routes log details on the server and return generic messages.
- **Security headers** (`next.config.ts`): `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`; the `X-Powered-By` header is off.

## 8. Environment variables

| Name | Public? | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all Supabase clients, image URLs |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | all Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | `utils/supabase/admin.ts` |
| `PAYMONGO_SECRET_KEY` | **no** | `/api/payments`, `/api/payments/verify` (optional) |
| `PAYMONGO_WEBHOOK_SECRET` | **no** | `/api/payments/webhook` (recommended with payments) |
| `NEXT_PUBLIC_BASE_URL` | yes | OAuth and payment redirects (`lib/utils.ts`) |
| `DEMO_ACCOUNT_PASSWORD` | **no** | `signInAsDemo`, `scripts/create-demo-accounts.mjs` (optional) |

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `relation "public.listings" does not exist` | Run `supabase/schema.sql` in the SQL Editor. |
| `Could not find a relationship between ...` | Run the schema again (it reloads the PostgREST schema cache at the end). |
| Login goes back to the wrong site | Check `NEXT_PUBLIC_BASE_URL` and the Supabase Redirect URLs. |
| `new row violates row-level security policy` | You're not logged in, or you're editing someone else's row. |
| Photos don't load | Check that the `images` bucket exists and is public, and that `NEXT_PUBLIC_SUPABASE_URL` is right. |
| Payment stays "Something went wrong" | Check `SUPABASE_SERVICE_ROLE_KEY` and `PAYMONGO_SECRET_KEY`, and that you authorized the test payment. |
| "Online payment is not available right now." | `PAYMONGO_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is missing. This is expected if you don't use payments. |
| Guest paid but the booking isn't confirmed | Set up the PayMongo webhook (below) so bookings confirm even if the guest closes the browser. |
| "Demo accounts are not available right now." | Set `DEMO_ACCOUNT_PASSWORD`, enable the Email provider, and run `npm run demo:accounts`. |

## PayMongo webhook

Without it, a booking is only confirmed when the guest's browser comes back to `/payment/success`.

1. PayMongo Dashboard → **Developers → Webhooks → Create webhook** (or `POST https://api.paymongo.com/v1/webhooks`).
2. URL: `https://<your-domain>/api/payments/webhook`. Events: **`source.chargeable`**.
3. Copy the webhook **secret key** (`whsk_…`) into `PAYMONGO_WEBHOOK_SECRET` in Vercel, then redeploy.
4. Use a test webhook with `sk_test_` keys and a live one with `sk_live_` keys. The signature check picks the right one automatically.

## 10. Design system

All tokens live in `app/globals.css`; components only use the Tailwind names below.

| Token | Value | Used for |
|---|---|---|
| `background` / `card` | `#ffffff` | Page and surfaces |
| `foreground` | `#1f1b17` | Text, selected dates, active category |
| `muted` / `muted-foreground` | `#efebe6` / `#6b625a` | Placeholders, secondary text |
| `border` | `#e7e1d9` | 1px hairlines |
| `primary` | `#d64550` | The one accent: search, reserve, hearts |
| `destructive` / `success` | `#b42318` / `#2f7d57` | Errors, payment success |

- **Type:** Geist for text, Fraunces (`font-display`) for headings and prices.
- **Elevation:** `shadow-xs` … `shadow-xl` are soft, two-layer shadows (overridden in `@theme`).
- **Radius:** `rounded-xl` for inputs and tiles, `rounded-2xl` for cards and photos, full for pills.
- **Layout:** `page-container` (max 1360px, 16/24/40px gutters) and `ListingGrid` (1 → 5 columns).
- **Icons:** lucide-react only; category icons are defined in `app/lib/categoryItems.ts`.
