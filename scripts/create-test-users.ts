/**
 * Dev-only helper: creates two confirmed throwaway accounts for local testing
 * (manual QA and the RLS isolation test). Requires SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: npx tsx scripts/create-test-users.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

const users = [
  {
    email: process.env.TEST_USER_A_EMAIL ?? "test-a@example.com",
    password: process.env.TEST_USER_A_PASSWORD,
  },
  {
    email: process.env.TEST_USER_B_EMAIL ?? "test-b@example.com",
    password: process.env.TEST_USER_B_PASSWORD,
  },
];

for (const { email, password } of users) {
  if (!password) {
    console.error(`Set a password env var for ${email} first.`);
    process.exit(1);
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && error.code !== "email_exists") {
    console.error(`Failed to create ${email}:`, error.message);
    process.exit(1);
  }

  console.log(`${error ? "Already exists" : "Created"}: ${email}`);
}
