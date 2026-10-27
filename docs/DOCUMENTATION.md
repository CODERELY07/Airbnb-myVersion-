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
  components/                 UI pieces (cards, navbar, search bar, forms)
  lib/                        Categories, countries, PSGC location helpers
components/
  ui/                         shadcn/ui components
  CalendarReservation.tsx     Booking calendar
lib/
  supabase/auth.ts            getClientUserProfile()
  supabase/listings.ts        Server Actions (create, edit, delete, favorites)
  utils.ts                    cn(), BASE_URL, getImageUrl(), getNights(), isPaymentEnabled()
  demoAccounts.json           Demo account emails and labels (no passwords)
scripts/
  create-demo-accounts.mjs    Creates or resets the demo users
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
| startDate, endDate | timestamptz | |
| nights | int | calculated on the server |
| totalPrice | numeric | calculated on the server |
| isPaid | bool | only the server can set it to true |
| paymentSourceId | text | PayMongo source id |

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
1. **Airbnb your Home** (`NavUser`) calls `createListing.createListing`. It reuses your last
   unfinished listing or inserts a new empty one, then sends you to the next step.
2. `/create/[id]/structure` → `createCategoryAction` sets `categoryName` and `addedCategory`.
3. `/create/[id]/description` → `createDescription` uploads the photo to storage and saves the details.
4. `/create/[id]/address` → `createLocation` saves the PSGC codes and `addedLocation`.

### Edit and delete
`/edit/[id]/*` pages load the listing with `getOwnListing()`, which redirects if you don't own it.
Delete removes the photo from storage, then the row.

### Search
`SearchBar` → `/search?destination=&checkIn=&checkOut=&guests=&bedrooms=&bathrooms=` →
`listings.searchListings`. It filters finished listings by province and capacity, then
removes listings that have a reservation overlapping the dates (the overlap check runs in SQL).

### Book and pay (GCash)
```
ReservationCard ──POST /api/payments {listingId, checkIn, checkOut}
   server: checks login → calculates nights and price from the DB → checks duplicate and overlap
           → inserts reservation (isPaid=false) → creates PayMongo GCash source
           → saves paymentSourceId → returns checkout_url
Browser ──► PayMongo GCash page
   success ─► /payment/success ──POST /api/payments/verify {reservationId}
                server: source status must be "chargeable" → creates the PayMongo payment
                        → payment status must be "paid" → sets isPaid = true
   failed  ─► /payment/failed  → deletes the unpaid reservation
```

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
| `listings.createReservation` | mutation | Reservation without payment (not used by the UI) |
| `listings.fetchReservation` | query | Booked date ranges for the calendar |
| `listings.getReservationListings` | query | A user's reservations with their listing |
| `listings.searchListings` | query | Search with availability |
| `listings.updateListing` / `updateLocation` / `updateCategory` | mutation | Edit |
| `listings.deleteListing` | mutation | Delete a listing and its photo |
| `location.listUnique` | query | Provinces that have listings (search dropdown) |

## 6. REST routes

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/payments` | POST | `{ listingId, checkIn, checkOut }` | PayMongo source (`data.attributes.redirect.checkout_url`) |
| `/api/payments/verify` | POST | `{ reservationId }` | `{ success: true }` or an error |
| `/auth/callback` | GET | `?code=&next=` | Redirect |

## 7. Security model

- **RLS on every table.** Reads are public for listings, host profiles and reservation dates.
  Only the owner can insert, update or delete their own rows. Favorites are private.
- **Reservations can't be marked paid from the browser.** There is no update policy, and inserts
  must have `isPaid = false`. Only `/api/payments/verify` (service role) sets `isPaid`, after PayMongo confirms.
- **The price is calculated on the server** from `listings.price` and the dates. The client only sends ids and dates.
- **Double booking is blocked** on the server by an overlap check before inserting.
- **The service role key** is only used in `utils/supabase/admin.ts`, which is marked `server-only`.
- **Uploads** are limited to images up to 5 MB by the storage bucket.
- **Open redirect protection:** `/auth/callback` only accepts relative `next` paths.

## 8. Environment variables

| Name | Public? | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all Supabase clients, image URLs |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | all Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | `utils/supabase/admin.ts` |
| `PAYMONGO_SECRET_KEY` | **no** | `/api/payments`, `/api/payments/verify` (optional) |
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
| "Demo accounts are not available right now." | Set `DEMO_ACCOUNT_PASSWORD`, enable the Email provider, and run `npm run demo:accounts`. |
