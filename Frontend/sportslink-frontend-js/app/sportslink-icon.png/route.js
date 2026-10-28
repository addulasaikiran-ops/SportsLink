import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const icon = await readFile(path.join(process.cwd(), "public", "Document Handshake Partnership Icon.png"));
  return new Response(icon, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
}
