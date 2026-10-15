import Link from "next/link";
import { CalmScreen } from "@/components/marketing/calm-screen";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <title>Page not found · FocusFlow</title>
      <CalmScreen
        mood="sleepy"
        tint="lavender"
        eyebrow="404"
        title={
          <>
            That page <em>wandered off.</em>
          </>
        }
        actions={
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Take me home
          </Link>
        }
      >
        <p>Nothing&apos;s wrong on your end. Let&apos;s get you back to something useful.</p>
      </CalmScreen>
    </>
  );
}
