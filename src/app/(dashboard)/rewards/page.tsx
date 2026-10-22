import { redirect } from "next/navigation";

/** XP, levels and rewards are switched off (build plan step 4). */
export default function RewardsPage() {
  redirect("/today");
}
