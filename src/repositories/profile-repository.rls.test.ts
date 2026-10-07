/**
 * RLS isolation test (spec §21/§60). Runs against a real Supabase project —
 * skipped automatically when credentials aren't configured, so it never
 * blocks `npm run test` in an environment without a live backend.
 *
 * Setup: fill NEXT_PUBLIC_SUPABASE_URL/ANON_KEY and TEST_USER_A/B_* in
 * .env.local, then run `npx tsx scripts/create-test-users.ts` once.
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getProfile, updateProfile } from "./profile-repository";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const emailA = process.env.TEST_USER_A_EMAIL;
const passwordA = process.env.TEST_USER_A_PASSWORD;
const emailB = process.env.TEST_USER_B_EMAIL;
const passwordB = process.env.TEST_USER_B_PASSWORD;

const hasLiveCredentials = Boolean(url && anonKey && emailA && passwordA && emailB && passwordB);

describe.skipIf(!hasLiveCredentials)("profiles RLS isolation", () => {
  it("user A can read and update only their own profile, never user B's", async () => {
    // No persisted session: two clients in one process would otherwise share
    // a storage slot and overwrite each other's login.
    const isolated = { auth: { persistSession: false, autoRefreshToken: false } };
    const clientA = createClient(url!, anonKey!, isolated);
    const clientB = createClient(url!, anonKey!, isolated);

    const { data: signInA, error: signInAError } = await clientA.auth.signInWithPassword({
      email: emailA!,
      password: passwordA!,
    });
    expect(signInAError).toBeNull();

    const { data: signInB, error: signInBError } = await clientB.auth.signInWithPassword({
      email: emailB!,
      password: passwordB!,
    });
    expect(signInBError).toBeNull();

    const userAId = signInA.user!.id;
    const userBId = signInB.user!.id;

    // Positive control: each user can read their own row.
    await expect(getProfile(clientA, userAId)).resolves.not.toBeNull();
    await expect(getProfile(clientB, userBId)).resolves.not.toBeNull();

    // A cannot read B's row.
    const bAsSeenByA = await getProfile(clientA, userBId);
    expect(bAsSeenByA).toBeNull();

    // A cannot update B's row — RLS matches zero rows, so the client throws
    // (`.single()` finds nothing) rather than silently succeeding.
    await expect(
      updateProfile(clientA, userBId, { displayName: "hijacked" }),
    ).rejects.toBeTruthy();

    // Confirm B's row was in fact untouched.
    const bAfterAttack = await getProfile(clientB, userBId);
    expect(bAfterAttack?.displayName).not.toBe("hijacked");
  });
});
