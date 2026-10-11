import "./globals.css";
import { AppShell } from "@/components/AppShell";
export const metadata = {
  title: { default: "SPORTSLINK — Your world of sport, connected", template: "%s | SPORTSLINK" },
  description: "A professional network for athletes, coaches, scouts, clubs, and sports professionals.",
  applicationName: "SPORTSLINK",
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
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
