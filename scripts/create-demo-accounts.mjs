// Creates (or resets) the demo accounts listed in lib/demoAccounts.json.
// Run: npm run demo:accounts   (reads .env.local)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_ACCOUNT_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_ACCOUNT_PASSWORD in .env.local"
  );
  process.exit(1);
}

const accounts = JSON.parse(
  readFileSync(new URL("../lib/demoAccounts.json", import.meta.url), "utf-8")
);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});

if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}

for (const account of accounts) {
  const attributes = {
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: account.label, name: account.label },
  };

  const found = existing.users.find((u) => u.email === account.email);

  const { error } = found
    ? await supabase.auth.admin.updateUserById(found.id, attributes)
    : await supabase.auth.admin.createUser(attributes);

  if (error) {
    console.error(`✗ ${account.email}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${account.email} ${found ? "updated" : "created"}`);
  }
}
