// Creates (or recreates) the demo listings in scripts/demo-listings.json,
// owned by the Demo Host account, with photos from Unsplash.
// Run: npm run demo:listings   (needs npm run demo:accounts first)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf-8"));
const listings = readJson("./demo-listings.json");
const hostEmail = readJson("../lib/demoAccounts.json").find((a) => a.role === "host").email;

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Find the Demo Host
const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const host = users?.users.find((u) => u.email === hostEmail);

if (usersError || !host) {
  console.error(`Demo Host (${hostEmail}) not found. Run "npm run demo:accounts" first.`);
  process.exit(1);
}

// 2. Remove earlier demo listings (photos stored under "demo/"); other listings are kept
const { data: old } = await supabase
  .from("listings")
  .select("id, photo")
  .eq("userId", host.id)
  .like("photo", "demo/%");

if (old?.length) {
  await supabase.storage.from("images").remove(old.map((l) => l.photo));
  await supabase.from("listings").delete().in("id", old.map((l) => l.id));
  console.log(`Removed ${old.length} old demo listings`);
}

// 3. Upload photos and create listings
for (const item of listings) {
  const { slug, unsplash, ...fields } = item;
  const photo = `demo/${slug}.jpg`;

  const res = await fetch(`https://images.unsplash.com/photo-${unsplash}?w=1600&q=80&fm=jpg&fit=crop`);
  if (!res.ok) {
    console.error(`✗ ${fields.title}: photo download failed (${res.status})`);
    process.exitCode = 1;
    continue;
  }

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(photo, await res.arrayBuffer(), { contentType: "image/jpeg", cacheControl: "2592000", upsert: true });

  if (uploadError) {
    console.error(`✗ ${fields.title}: upload failed (${uploadError.message})`);
    process.exitCode = 1;
    continue;
  }

  const { error } = await supabase.from("listings").insert({
    ...fields,
    photo,
    userId: host.id,
    user_id: host.id,
    addedCategory: true,
    addedDescription: true,
    addedLocation: true,
  });

  if (error) {
    console.error(`✗ ${fields.title}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${fields.title}`);
  }
}
