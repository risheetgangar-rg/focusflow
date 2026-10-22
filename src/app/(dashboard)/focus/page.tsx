import { redirect } from "next/navigation";

/** Focus lives inside Today now (build plan step 3). Old links land there. */
export default function FocusPage() {
  redirect("/today");
}
