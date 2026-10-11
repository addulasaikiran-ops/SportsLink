import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Call a protected Spring Boot endpoint using the current Supabase access token.
 * Use only from client-side React code because it reads the browser auth session.
 */
export async function backendRequest(path, options = {}) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Backend API paths must be root-relative.");
  }

  const supabase = createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Check the frontend environment variables.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Please sign in before calling this API.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session is invalid or expired. Please sign in again.");
    }
    if (response.status === 403) {
      throw new Error("You are not authorized to perform this action.");
    }
    throw new Error(`Backend request failed with HTTP ${response.status}.`);
  }

  return response.json();
}
