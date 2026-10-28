export default function manifest() {
  return {
    name: "SPORTSLINK",
    short_name: "SPORTSLINK",
    description: "Your world of sport, connected.",
    start_url: "/",
    display: "standalone",
    background_color: "#050d22",
    theme_color: "#12305a",
    icons: [
      { src: "/sportslink-icon.png", sizes: "any", type: "image/png", purpose: "any" }
    ]
  };
}
