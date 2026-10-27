# Airbnb Clone (Philippines edition)

A simple Airbnb clone built with **Next.js 16**, **Supabase** and **tRPC**.
Hosts can list their home, guests can search by province and dates, save favorites,
and book a stay with **GCash** through **PayMongo**.

**Live demo:** https://airbnb-simple-clone-gilt.vercel.app

## Features

- Google sign-in (Supabase Auth)
- One-click **demo accounts** (Demo Host and Demo Guest) for portfolio visitors
- Create a listing in 3 steps: category → description and photo → address (Philippine regions, provinces, cities and barangays)
- Edit and delete your own listings
- Browse by category, search by province, dates, guests, bedrooms and bathrooms
- Favorites
- Reservation calendar that blocks already booked dates
- GCash payment through PayMongo, verified on the server. Without PayMongo keys the app still works and shows *"Online payment is not available right now."*

## Tech stack

| Part | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| API | tRPC 11 + TanStack Query |
| Database, auth, storage | Supabase (Postgres + RLS) |
| Payments | PayMongo (GCash sources) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), lucide-react |
| Locations | `@jobuntux/psgc` (Philippine regions to barangays) |

## Quick start

### 1. Requirements

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project
- A Google Cloud OAuth client (for Google login)
- A [PayMongo](https://paymongo.com) account (test keys are enough). Optional.

### 2. Clone and install

```bash
git clone https://github.com/CODERELY07/Airbnb-myVersion-.git
cd Airbnb-myVersion-
npm install
```

### 3. Create the database

1. Open your Supabase project, then **SQL Editor → New query**.
2. Paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

This creates the tables, security rules (RLS), the trigger that copies Google users into
`public.users`, and the public `images` storage bucket. It is safe to run again.

### 4. Turn on Google login

1. In Google Cloud Console create an **OAuth client ID** (Web application).
   Add this as an authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In Supabase, go to **Authentication → Sign In / Providers → Google**, enable it, and paste the client ID and secret.
3. In Supabase, go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (your Vercel URL in production)
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`

### 5. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (anon / publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role). **Secret, server only.** |
| `PAYMONGO_SECRET_KEY` | PayMongo → Developers → API keys (`sk_test_...`). Optional. |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` locally, your domain in production |
| `DEMO_ACCOUNT_PASSWORD` | Any long password you choose. Optional, needed for demo accounts. |

### 6. Demo accounts (optional)

Visitors can sign in with one click as **Demo Host** or **Demo Guest**, with no Google account needed.

1. In Supabase, go to **Authentication → Sign In / Providers** and make sure **Email** is enabled.
2. Set `DEMO_ACCOUNT_PASSWORD` in `.env.local`.
3. Create the accounts:

   ```bash
   npm run demo:accounts
   ```

The accounts are listed in [`lib/demoAccounts.json`](lib/demoAccounts.json). The password
stays on the server; the login buttons call a server action. Run the command again any time to reset the password.

### 7. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in with Google or a demo account, then choose **Airbnb your Home** from the menu.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run demo:accounts` | Create or reset the demo accounts |

## Deploy to Vercel

1. Import the repo on [vercel.com/new](https://vercel.com/new).
2. Add the environment variables (and `DEMO_ACCOUNT_PASSWORD` for demo logins), and set `NEXT_PUBLIC_BASE_URL` to your Vercel URL.
3. Add `https://<your-vercel-url>/auth/callback` to the Supabase redirect URLs.
4. Deploy.

## Documentation

See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for the project structure, the database,
the main flows (listing, booking, payment) and the security model.

## Testing payments

With a `sk_test_` key PayMongo shows a test GCash page. Click **Authorize Test Payment** to
succeed or **Fail Test Payment** to cancel. No real money is charged.
