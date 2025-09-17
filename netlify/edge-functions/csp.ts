// netlify/edge-functions/csp.ts
// declare const HTMLRewriter: any;

export default async function handler(req: Request) {
  // Only transform HTML GETs
  if (req.method !== "GET") return fetch(req);

  const res = await fetch(req);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  // Make a nonce
  const nonce = cryptoRandomNonce();

  // Build YOUR strict CSP (no http/https wildcards)
  const csp =
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}'; ` +               // strict scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; " +
    "img-src 'self' https: data:; " +
    "frame-src https://www.google.com https://www.recaptcha.net https://oliver-f-anderson.shinyapps.io; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";



  // Inject nonce into ALL inline <script> tags
  const rewriter = new HTMLRewriter().on("script:not([src])", {
    element(el) { el.setAttribute("nonce", nonce); }
  });

  const transformed = rewriter.transform(res);

  // Set headers on the way out
  const newHeaders = new Headers(res.headers);
  newHeaders.set("Content-Security-Policy", csp);
  newHeaders.delete("Content-Security-Policy-Report-Only"); // avoid confusion

  return new Response(transformed.body, {
    status: res.status,
    headers: newHeaders
  });
}

function cryptoRandomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64-url without padding is fine
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
