-- =====================================================================
-- Airbnb clone - Supabase schema
-- Paste this whole file into Supabase Dashboard > SQL Editor > Run.
-- Safe to re-run (uses IF NOT EXISTS / DROP ... IF EXISTS).
--
-- Column names are camelCase on purpose (the app queries "userId",
-- "listingId", "addedCategory", ...), so they must stay double-quoted.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. USERS  (public profile, mirrored from auth.users)
--    Used by: listings.select('*, users(*)') -> full_name, avatar_url
--             reservation.select('*, users(*)')
-- ---------------------------------------------------------------------
-- No email here on purpose: this table is readable by everyone.
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Copy every new auth user (Google sign-in) into public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set full_name  = excluded.full_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_user();

-- Remove the email column if an older version of this file created it
alter table public.users drop column if exists email;

-- Backfill users that signed up before this trigger existed
insert into public.users (id, full_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. LISTINGS
--    Created empty with only "userId", then filled step by step:
--    structure (categoryName) -> description -> address (location codes)
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),

  -- owner. Only "userId" has a foreign key so that users(*) is unambiguous.
  "userId"           uuid not null references public.users (id) on delete cascade,
  user_id            uuid,  -- also written by createCategory; kept as plain copy

  -- step 1: structure
  "categoryName"     text,
  "addedCategory"    boolean not null default false,

  -- step 2: description
  title              text,
  description        text,
  price              numeric,
  bedrooms           integer,
  bathrooms          integer,
  guests             integer,
  photo              text,      -- path inside the "images" storage bucket
  "addedDescription" boolean not null default false,

  -- step 3: location (PSGC codes)
  "regionCode"       text,
  "provinceCode"     text,
  "munCityCode"      text,
  "barangayCode"     text,
  country            text,      -- read by some cards, not written yet
  "addedLocation"    boolean not null default false
);

create index if not exists listings_userid_idx   on public.listings ("userId");
create index if not exists listings_category_idx on public.listings ("categoryName");
create index if not exists listings_province_idx on public.listings ("provinceCode");

-- ---------------------------------------------------------------------
-- 3. FAVORITES
--    Used by: listings.select('*, favorites(*)'), favorites.select('*, listings(*)')
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  "userId"     uuid not null references public.users (id) on delete cascade,
  "listingId"  uuid not null references public.listings (id) on delete cascade,
  unique ("userId", "listingId")
);

create index if not exists favorites_listingid_idx on public.favorites ("listingId");

-- ---------------------------------------------------------------------
-- 4. RESERVATION  (singular name - that is what the code uses)
--    Used by: payments API, calendar, search availability, reservations page
-- ---------------------------------------------------------------------
create table if not exists public.reservation (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  "userId"      uuid not null references public.users (id) on delete cascade,
  "listingId"   uuid not null references public.listings (id) on delete cascade,
  "startDate"   timestamptz not null,
  "endDate"     timestamptz not null,
  nights        integer,
  "totalPrice"  numeric,
  "isPaid"      boolean not null default false,
  "paymentSourceId" text   -- PayMongo source id, set by the server
);

alter table public.reservation add column if not exists "paymentSourceId" text;

create index if not exists reservation_listingid_idx on public.reservation ("listingId");
create index if not exists reservation_userid_idx    on public.reservation ("userId");

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.users       enable row level security;
alter table public.listings    enable row level security;
alter table public.favorites   enable row level security;
alter table public.reservation enable row level security;

-- users: everyone can see host profiles, you can only edit yourself
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- listings: public read, owner writes
drop policy if exists "listings_select_all" on public.listings;
create policy "listings_select_all" on public.listings
  for select using (true);

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own" on public.listings
  for insert to authenticated with check (auth.uid() = "userId");

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
  for update to authenticated
  using (auth.uid() = "userId") with check (auth.uid() = "userId");

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings
  for delete to authenticated using (auth.uid() = "userId");

-- favorites: private to each user.
-- This also makes listings.select('*, favorites(*)') return only the
-- logged-in user's favorite, which is what the home page heart expects.
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated using (auth.uid() = "userId");

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check (auth.uid() = "userId");

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using (auth.uid() = "userId");

-- reservation: private to the guest. Booked dates are public through the
-- reservation_dates view below. Guests can create (always unpaid) and cancel their own.
-- There is NO update policy: only the server (service role key) can set
-- "isPaid" after PayMongo confirms the payment.
-- Guests only see their own reservations (who booked and what they paid stays private)
drop policy if exists "reservation_select_all" on public.reservation;
drop policy if exists "reservation_select_own" on public.reservation;
create policy "reservation_select_own" on public.reservation
  for select to authenticated using (auth.uid() = "userId");

-- Public, read-only list of booked dates for the calendar, search and
-- overlap check. No guest id or price. The view runs as its owner, so it can
-- read every row even though the table itself is private.
create or replace view public.reservation_dates as
  select "listingId", "startDate", "endDate", "isPaid", created_at
  from public.reservation;

revoke all on public.reservation_dates from anon, authenticated;
grant select on public.reservation_dates to anon, authenticated;

drop policy if exists "reservation_insert_own" on public.reservation;
create policy "reservation_insert_own" on public.reservation
  for insert to authenticated
  with check (auth.uid() = "userId" and "isPaid" = false and "paymentSourceId" is null);

drop policy if exists "reservation_update_own" on public.reservation;

drop policy if exists "reservation_delete_own" on public.reservation;
create policy "reservation_delete_own" on public.reservation
  for delete to authenticated using (auth.uid() = "userId");

-- ---------------------------------------------------------------------
-- 6. STORAGE  -  public "images" bucket for listing photos
--    URL used in the app: /storage/v1/object/public/images/<path>
-- ---------------------------------------------------------------------
-- Max 5MB, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/*'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "images_auth_upload" on storage.objects;
create policy "images_auth_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'images');

drop policy if exists "images_owner_update" on storage.objects;
create policy "images_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and owner = auth.uid());

drop policy if exists "images_owner_delete" on storage.objects;
create policy "images_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and owner = auth.uid());

-- Make PostgREST pick up the new tables/relationships immediately
notify pgrst, 'reload schema';
