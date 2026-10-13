import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { OfflineSupport } from "@/components/OfflineSupport";
import Script from "next/script";
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sportslink.up.railway.app"),
  title: { default: "SPORTSLINK — Your world of sport, connected", template: "%s | SPORTSLINK" },
  description: "A professional network for athletes, coaches, scouts, clubs, and sports professionals.",
  applicationName: "SPORTSLINK",
  icons: {
    icon: [{ url: "/Document%20Handshake%20Partnership%20Icon.png", type: "image/png" }],
    shortcut: ["/Document%20Handshake%20Partnership%20Icon.png"],
    apple: [{ url: "/Document%20Handshake%20Partnership%20Icon.png", type: "image/png" }]
  },
  keywords: ["sports networking", "athletes", "coaches", "sports careers", "clubs"],
  openGraph: {
    title: "SPORTSLINK — Your world of sport, connected",
    description: "Connect with athletes, coaches, clubs, scouts and sports professionals. Discover opportunities and build meaningful connections across the sports industry.",
    siteName: "SPORTSLINK",
    type: "website",
    images: [{ url: "/Cinematic%20Sports%20Stadium%20Silhouettes%20at%20Dusk.png", alt: "SPORTSLINK — the professional network for sport" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "SPORTSLINK — Your world of sport, connected",
    description: "Connect with athletes, coaches, clubs, scouts and sports professionals.",
    images: ["/Cinematic%20Sports%20Stadium%20Silhouettes%20at%20Dusk.png"]
  }
};
export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sportslink.up.railway.app/#organization",
        name: "SPORTSLINK",
        url: "https://sportslink.up.railway.app/",
        description: "A professional network connecting athletes, coaches, scouts, clubs and sports professionals.",
        logo: {
          "@type": "ImageObject",
          url: "https://sportslink.up.railway.app/Document%20Handshake%20Partnership%20Icon.png"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://sportslink.up.railway.app/#website",
        name: "SPORTSLINK",
        url: "https://sportslink.up.railway.app/",
        description: "Connect with athletes, coaches, clubs, scouts and sports professionals.",
        publisher: { "@id": "https://sportslink.up.railway.app/#organization" }
      }
    ]
  };
  return <html lang="en" suppressHydrationWarning><head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head><body><Script id="sportslink-theme-init" strategy="beforeInteractive">{`try{const t=localStorage.getItem("sportslink-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;}catch(e){}`}</Script><OfflineSupport /><AppShell>{children}</AppShell></body></html>;
}
