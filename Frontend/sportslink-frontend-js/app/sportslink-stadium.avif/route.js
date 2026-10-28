import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public", "sportslink-stadium.webp"));
  const image = await sharp(source).rotate().resize({ width: 1920, withoutEnlargement: true }).avif({ quality: 55, effort: 4 }).toBuffer();
  return new Response(image, { headers: { "Content-Type": "image/avif", "Cache-Control": "public, max-age=86400, s-maxage=604800", "Content-Length": String(image.length) } });
}
