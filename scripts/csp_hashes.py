# scripts/csp_hashes.py
import base64, hashlib, re, glob, os, sys

# Detect publish dir
PUBLISH_DIR = "_site"
if not PUBLISH_DIR:
    print("ERROR: Could not find _site/", file=sys.stderr)
    sys.exit(1)

def sha256_b64(b: bytes) -> str:
    return base64.b64encode(hashlib.sha256(b).digest()).decode()

script_hashes = set()
style_hashes  = set()

# Heuristics to include only the external domains you actually use
uses_jsdelivr   = False
uses_recaptcha  = False
uses_shiny      = False
uses_youtube    = False
uses_twitter    = False

html_files = glob.glob(os.path.join(PUBLISH_DIR, "**", "*.html"), recursive=True)

SCRIPT_INLINE_RE = re.compile(rb"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S|re.I)
STYLE_INLINE_RE  = re.compile(rb"<style[^>]*>(.*?)</style>", re.S|re.I)
STYLE_ATTR_RE = re.compile(rb'style\s*=\s*"(.*?)"', re.S|re.I)



for path in html_files:
    with open(path, "rb") as f:
        html = f.read()

    # Collect inline script/style hashes EXACT bytes (no strip!)
    for m in SCRIPT_INLINE_RE.finditer(html):
        content = m.group(1)
        if content and content.strip():  # skip truly empty/whitespace-only blocks
            script_hashes.add("sha256-" + sha256_b64(content))

    for m in STYLE_ATTR_RE.finditer(html):
        val = m.group(1)
        if val and val.strip():
            style_hashes.add("sha256-" + sha256_b64(val))

    # Detect external domains actually referenced
    if b"cdn.jsdelivr.net"      in html: uses_jsdelivr   = True
    if b"www.google.com/recaptcha" in html or b"data-netlify-recaptcha" in html or b"www.recaptcha.net" in html:
        uses_recaptcha = True
    if b"shinyapps.io" in html:  uses_shiny = True
    if b"youtube.com" in html or b"youtube-nocookie.com" in html: uses_youtube = True
    if b"platform.twitter.com" in html or b"cdn.syndication.twimg.com" in html: uses_twitter = True

# Build header text
script_src = ["'self'"] + sorted(script_hashes)

style_src  = ["'self' 'unsafe-inline'"] + sorted(style_hashes)
style_src.append("https://fonts.googleapis.com")
style_src.append("https://fonts.gstatic.com")

font_src = ["'self'"]
font_src.append("https://fonts.gstatic.com")
font_src.append("https://fonts.googleapis.com")

if uses_jsdelivr:
    style_src.append("https://cdn.jsdelivr.net")
    font_src.append("https://cdn.jsdelivr.net")

frame_src = []
script_hosts = []
img_src = ["'self'", "https:", "data:"]

if uses_recaptcha:
    script_hosts += ["https://www.google.com", "https://www.gstatic.com", "https://www.recaptcha.net"]
    frame_src    += ["https://www.google.com", "https://www.recaptcha.net"]

if uses_shiny:
    # allow the whole shinyapps.io origin (no trailing slash)
    frame_src += ["https://oliver-f-anderson.shinyapps.io"]

if uses_youtube:
    frame_src += ["https://www.youtube.com", "https://www.youtube-nocookie.com"]

if uses_twitter:
    script_hosts += ["https://platform.twitter.com", "https://cdn.syndication.twimg.com"]
    frame_src    += ["https://platform.twitter.com"]

# Compose multi-line CSP
csp = "Content-Security-Policy:" + " ".join([
    "  default-src 'self';",
    "  script-src " + " ".join(script_src + script_hosts) + ";",
    "  style-src "  + " ".join(style_src) + ";",
    "  font-src "   + " ".join(font_src) + ";",
    "  img-src "    + " ".join(img_src)  + ";",
    ("  frame-src " + " ".join(sorted(set(frame_src))) + ";") if frame_src else "  frame-src 'none';",
    "  object-src 'none';",
    "  base-uri 'self';",
    "  frame-ancestors 'none';",
])

headers = f"""/*

  # Strict transport & core protections
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=()
  Cross-Origin-Resource-Policy: same-site
  {csp}
"""

out_path = os.path.join(PUBLISH_DIR, "_headers")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(headers)

print(f"Wrote {out_path}")
print(f"  script hashes: {len(script_hashes)}")
print(f"  style  hashes: {len(style_hashes)}")