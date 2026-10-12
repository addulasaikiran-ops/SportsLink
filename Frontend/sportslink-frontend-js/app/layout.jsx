import "./globals.css";
import { AppShell } from "@/components/AppShell";
import Script from "next/script";
export const metadata = {
  title: { default: "SPORTSLINK — Your world of sport, connected", template: "%s | SPORTSLINK" },
  description: "A professional network for athletes, coaches, scouts, clubs, and sports professionals.",
  applicationName: "SPORTSLINK",
  icons: {
    icon: [{ url: "/favicon_tag_pro_SL_ghost.png", type: "image/png" }],
    shortcut: ["/favicon_tag_pro_SL_ghost.png"],
    apple: [{ url: "/favicon_tag_pro_SL_ghost.png", type: "image/png" }]
  },
  keywords: ["sports networking", "athletes", "coaches", "sports careers", "clubs"],
  openGraph: {
    title: "SPORTSLINK — Your world of sport, connected",
    description: "Connect with the people moving sport forward.",
    siteName: "SPORTSLINK",
    type: "website"
  },
  robots: { index: false, follow: false }
};
export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><body><Script id="sportslink-theme-init" strategy="beforeInteractive">{`try{const t=localStorage.getItem("sportslink-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;}catch(e){}`}</Script><AppShell>{children}</AppShell></body></html>;
}
