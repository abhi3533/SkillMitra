const ALLOWED_ORIGINS = [
  "https://skillmitra.online",
  "https://www.skillmitra.online",
  "https://skillmitra-online.lovable.app",
  "https://preview--skillmitra-online.lovable.app",
  "https://id-preview--74dea9d9-e666-4a62-9a41-89f5bbddf9c0.lovable.app",
  "http://localhost:5173", // dev only
];

const CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Vary": "Origin",
  };
}
