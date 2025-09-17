export default async function handler(request, context) {
  // Only GET requests
  if (request.method !== "GET") return context.next();

  // If we already processed this response, bail to avoid loops
  if (request.headers.get("x-csp-processed") === "1") {
    return context.next();
  }

  // Get the next response in the chain (origin/static/etc.)
  const res = await context.next();

  // Only transform HTML
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  // Generate a nonce
  const nonce = cryptoRandomNonce();

  // Build YOUR strict CSP (no http:/https: wildcards)
  const csp =
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}'; ` +       // strict scripts with nonce
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; " +
    "img-src 'self' https: data:; " +
    "frame-src https://www.google.com https://www.recaptcha.net https://oliver-f-anderson.shinyapps.io; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

  // Inject nonce on all inline scripts (no src)
  const rewriter = new HTMLRewriter().on("script:not([src])", {
    element(el) { el.setAttribute("nonce", nonce); }
  });

  const transformed = rewriter.transform(res);

  // Set headers; also set a guard so re-entrancy is avoided
  const headers = new Headers(res.headers);
  headers.set("Content-Security-Policy", csp);
  headers.delete("Content-Security-Policy-Report-Only");
  headers.set("x-csp-processed", "1");

  return new Response(transformed.body, { status: res.status, headers });
}

function cryptoRandomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
