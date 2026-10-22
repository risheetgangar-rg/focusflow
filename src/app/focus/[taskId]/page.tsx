import { redirect } from "next/navigation";

/** Focus lives inside Today now: this task goes on Today's card and the timer starts. */
export default async function FocusTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  redirect(`/today?focus=${encodeURIComponent(taskId)}`);
}
