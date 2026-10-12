const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sportslink.up.railway.app";
const publicPages = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" }
];

export default function sitemap() {
  return publicPages.map((page) => ({
    url: new URL(page.path, siteUrl).toString(),
    changeFrequency: page.changeFrequency,
    priority: page.priority
  }));
}