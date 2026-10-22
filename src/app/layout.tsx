import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Horizon is very wide, so it is scaled down to sit comfortably at heading sizes.
const horizon = localFont({
  src: "./fonts/Horizon-Regular.otf",
  variable: "--font-horizon",
  display: "swap",
  declarations: [{ prop: "size-adjust", value: "74%" }],
});
const horizonOutline = localFont({
  src: "./fonts/Horizon-Outlined.otf",
  variable: "--font-horizon-outline",
  display: "swap",
  declarations: [{ prop: "size-adjust", value: "74%" }],
});

export const metadata: Metadata = {
  title: { default: "Unstuck — one step at a time", template: "%s · Unstuck" },
  description:
    "A calm, friendly companion for brains that start late: dump everything out, see what to do next, and make it easy to begin.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "Unstuck — one step at a time",
    description: "Dump it all out. See what's next. Make it easy to begin.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a00a8",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the saved theme before first paint so there's no flash of the wrong
 * colors. The theme is stored in localStorage and mirrored from the profile
 * by <ThemeSync/> once the person is signed in. (Per-person providers live in
 * the signed-in layouts, not here, so public pages stay statically cacheable.)
 */
const themeScript = `(function(){try{var t=localStorage.getItem('ff-theme')||'paper';var r=document.documentElement;r.dataset.theme=t;if(t==='midnight')r.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${horizon.variable} ${horizonOutline.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
