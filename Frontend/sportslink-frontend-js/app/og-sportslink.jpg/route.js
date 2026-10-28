import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const stadium = await readFile(path.join(process.cwd(), "public", "sportslink-stadium.webp"));
  const overlay = Buffer.from(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050d22" stop-opacity=".94"/><stop offset=".58" stop-color="#071a38" stop-opacity=".72"/><stop offset="1" stop-color="#071a38" stop-opacity=".34"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <rect x="82" y="92" width="8" height="118" rx="4" fill="#70d522"/>
    <text x="118" y="145" fill="#f7faff" font-family="Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="-2">SPORTSLINK</text>
    <text x="118" y="205" fill="#70d522" font-family="Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="5">YOUR WORLD OF SPORT, CONNECTED</text>
    <text x="118" y="300" fill="#f7faff" font-family="Arial, sans-serif" font-size="34" font-weight="600">Meet your people. Find your next move.</text>
    <text x="118" y="350" fill="#d8e4f4" font-family="Arial, sans-serif" font-size="22">A professional network for the world of sport.</text>
    <rect x="118" y="410" width="230" height="5" rx="2.5" fill="#70d522"/>
  </svg>`);
  const image = await sharp(stadium).resize(1200, 630, { fit: "cover", position: "centre" }).composite([{ input: overlay }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(image, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=604800", "Content-Length": String(image.length) } });
}
