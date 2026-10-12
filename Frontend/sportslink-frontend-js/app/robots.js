const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sportslink.up.railway.app";

export default function robots() {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/about", "/privacy"],
      disallow: [
        "/home", "/network", "/discover", "/opportunities", "/messages",
        "/notifications", "/profile", "/bookmarks", "/organizations",
        "/settings", "/events", "/onboarding", "/joined"
      ]
    }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString()
  };
}