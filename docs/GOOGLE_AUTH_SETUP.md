# Google Sign-in Setup

How to connect **Google Cloud Console** and **Supabase** so "Continue with Google" works,
both locally and on Vercel. Takes about 10 minutes.

```
User clicks "Continue with Google"
  → Supabase  (https://<project-ref>.supabase.co/auth/v1/authorize)
  → Google login screen
  → Supabase callback  (https://<project-ref>.supabase.co/auth/v1/callback)   ← registered in Google
  → your app  (https://<your-site>/auth/callback)                             ← allowed in Supabase
  → logged in
```

You need:
- your **Supabase project ref**: the part before `.supabase.co` in `NEXT_PUBLIC_SUPABASE_URL`
  (this project uses `lchkueoxcfpspfrylxvp`)
- your **site URLs**: `http://localhost:3000` and your Vercel URL
  (e.g. `https://airbnb-simple-clone-gilt.vercel.app`)

> The Google **Client secret** belongs **only** in the Supabase dashboard.
> Never put it in the code, a `.txt` file, `.env.example`, or a commit.

---

## Part 1: Google Cloud Console

### 1. Create or choose a project
1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Use the project picker at the top: **New project** (e.g. `airbnb-clone`), or pick an existing one.

### 2. Set up the consent screen
Open **Google Auth Platform** ([console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview)) and click **Get started** if asked.

1. **Branding**
   - App name: `Airbnb Clone` (shown on the Google login screen)
   - User support email: your email
   - Developer contact email: your email
   - Leave the logo empty. Uploading one requires Google to verify the app.
2. **Audience**
   - User type: **External**
   - Publishing status: while it says **Testing**, only the emails under *Test users* can sign in.
     For a public portfolio, click **Publish app** → **In production**. The basic scopes below
     need no Google verification.
3. **Data Access** → **Add or remove scopes** → tick these three:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

   Then click **Update** and **Save**.

### 3. Create the OAuth client
**Google Auth Platform → Clients → Create client**

| Field | Value |
|---|---|
| Application type | **Web application** |
| Name | `Airbnb Clone Web` |
| Authorized JavaScript origins | `http://localhost:3000`<br>`https://airbnb-simple-clone-gilt.vercel.app` |
| Authorized redirect URIs | `https://<project-ref>.supabase.co/auth/v1/callback`<br>e.g. `https://lchkueoxcfpspfrylxvp.supabase.co/auth/v1/callback` |

> The **redirect URI is the Supabase callback**, not your site's `/auth/callback`.
> Copy it from Supabase (Part 2, step 1) so it matches exactly: `https`, no trailing slash.

Click **Create**. Copy the **Client ID** and **Client secret** straight into Supabase (next part).
Don't save them in any file.

---

## Part 2: Supabase

### 1. Turn on the Google provider
1. Open your project: `https://supabase.com/dashboard/project/<project-ref>`.
   **Check the ref in the address bar.** It must match `NEXT_PUBLIC_SUPABASE_URL`.
2. Go to **Authentication → Sign In / Providers → Google**.
3. Switch **Enable Sign in with Google** **on**.
4. Paste the **Client ID** and **Client secret** from Google.
5. The **Callback URL (for OAuth)** shown here is what goes into Google's *Authorized redirect URIs*.
6. Click **Save**. The Google row in the provider list should now say **Enabled**.

### 2. Allow your site URLs
**Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://airbnb-simple-clone-gilt.vercel.app` |
| Redirect URLs | `http://localhost:3000/auth/callback`<br>`https://airbnb-simple-clone-gilt.vercel.app/auth/callback` |

Optional, for Vercel preview deployments: `https://*-<your-vercel-team>.vercel.app/auth/callback`.

---

## Part 3: The app

Nothing secret goes in the app. It only needs to know its own URL so Google sends users back to the right place:

| Where | Variable | Value |
|---|---|---|
| `.env.local` | `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` |
| Vercel → Settings → Environment Variables | `NEXT_PUBLIC_BASE_URL` | `https://airbnb-simple-clone-gilt.vercel.app` (then redeploy) |

On Vercel, if `NEXT_PUBLIC_BASE_URL` is missing, the app falls back to the production domain (`lib/utils.ts`).

**Related code** (no changes needed):

| File | What it does |
|---|---|
| `app/components/Auth/action.ts` | `signInWithGoogle()`: checks Google is enabled, then redirects to Supabase |
| `app/components/Auth/AuthForm.tsx` | "Continue with Google" button and error message |
| `app/auth/callback/route.ts` | Swaps Google's code for a session cookie |
| `supabase/schema.sql` | Trigger that copies the Google name and photo into `public.users` |

---

## Part 4: Test it

1. **Check that Supabase has Google on.** Replace the two values and run:
   ```bash
   curl -s "https://<project-ref>.supabase.co/auth/v1/settings" -H "apikey: <NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>"
   ```
   You should see `"google":true`.
2. Run `npm run dev`, open http://localhost:3000, then go to **menu → Log in or sign up → Continue with Google**.
3. After choosing your account you land back on the home page, and the menu shows your name and Google photo.
4. Repeat on the live site.

---

## Rotating (changing) the Client secret

Do this if the secret was ever shared, committed or leaked.

1. **Google:** Google Auth Platform → **Clients** → your client → **Add secret**. Copy the new one.
2. **Supabase:** Authentication → Sign In / Providers → Google → paste the new secret → **Save**.
3. Test the login (Part 4).
4. **Google:** back in the client, **disable** and then **delete** the old secret.

The Client ID stays the same. Nothing changes in the code, `.env.local` or Vercel.

---

## Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| "Google sign-in is not available right now" in the login popup | Google provider is off in Supabase, or you edited a different project | Part 2, step 1. Check the project ref in the URL, switch it on, click **Save** |
| `{"msg":"Unsupported provider: provider is not enabled"}` | Same as above | Same as above |
| Google page: **Error 400: redirect_uri_mismatch** | The Supabase callback isn't in Google's *Authorized redirect URIs*, or differs slightly | Copy the callback URL from Supabase and paste it exactly (Part 1, step 3) |
| Google page: **Access blocked / app has not completed verification** | App is in **Testing** and your email isn't a test user | Add your email under *Audience → Test users*, or **Publish app** |
| After login you end up on **localhost** in production | Site URL or `NEXT_PUBLIC_BASE_URL` points to localhost | Fix *Site URL* (Part 2, step 2) and `NEXT_PUBLIC_BASE_URL` in Vercel, then redeploy |
| Back on the site but **not logged in**, URL has `?error=auth` | Your site's `/auth/callback` isn't in Supabase *Redirect URLs*, or the secret is wrong | Add it (Part 2, step 2). Re-paste the secret (Part 2, step 1) |
| Host name shows as empty on listings | The user signed in before the `users` trigger existed | Run `supabase/schema.sql` again; it backfills existing users |
