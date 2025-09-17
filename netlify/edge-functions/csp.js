export default async function handler(request, context) {
  // Only process GETs
  if (request.method !== "GET") return context.next();

  // Fetch the downstream response (no recursion)
  const res = await context.next();

  // Only transform HTML
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  // Read HTML and generate a nonce
  const html = await res.text();
  const nonce = cryptoRandomNonce();

  // Add nonce to every inline <script> (no src, no existing nonce)
  // Handles types like application/javascript, application/ld+json, etc.
  const withNonce = html.replace(
    /<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/gi,
    (m, attrs) => `<script${attrs} nonce="${nonce}">`
  );

  // Build YOUR strict CSP (no http/https wildcards)
  const csp =
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}'; ` + // strict scripts with nonce
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; " +
    "img-src 'self' https: data:; " +
    "frame-src https://www.google.com https://www.recaptcha.net https://oliver-f-anderson.shinyapps.io; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

  // Clone headers; set CSP; remove any Report-Only header; add a debug marker
  const headers = new Headers(res.headers);
  headers.set("Content-Security-Policy", csp);
  headers.delete("Content-Security-Policy-Report-Only");
  headers.set("x-csp-processed", "1");

  return new Response(withNonce, { status: res.status, headers });
}

function cryptoRandomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
