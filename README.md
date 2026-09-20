# TripM8

Marketing site for **TripM8 AI Inc.** — the AI workforce and agent network for travel.

A plain static site: hand-written HTML, one stylesheet, one small progressive-enhancement
script, and self-contained SVG artwork. **No build step, no dependencies, no framework.**

---

## Deploying to Cloudflare Pages

The repository root *is* the deployable output, so there is nothing to compile.

### Option A — connect the Git repository (recommended)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick this repository and the branch you want to publish.
3. Build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | **None** |
   | Build command | *(leave empty)* |
   | Build output directory | `/` |
   | Root directory | `/` |

4. **Save and Deploy.** Every push to the selected branch redeploys automatically;
   other branches get preview URLs.

### Option B — direct upload with Wrangler

```bash
npx wrangler pages deploy . --project-name=tripm8ai
```

`wrangler.toml` already sets `pages_build_output_dir = "."`, so the command needs no
extra flags.

### Custom domain

Pages project → **Custom domains** → add `tripm8.ai` and `www.tripm8.ai`. If the domain's
DNS is already on Cloudflare the records are created for you; TLS is issued automatically.

---

## What ships with the site

| File | Purpose |
| --- | --- |
| `index.html` | The full home page |
| `privacy.html`, `terms.html` | Legal pages linked from the footer |
| `404.html` | Served by Pages for unknown paths |
| `_headers` | Security headers + cache policy (Pages-native) |
| `_redirects` | Friendly URLs → on-page sections (Pages-native) |
| `assets/css/styles.css` | All styles, driven by CSS custom properties |
| `assets/js/main.js` | Sticky header, mobile menu, scroll-spy, reveal-on-scroll |
| `assets/img/*.svg` | Logo and all artwork |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO / PWA metadata |
| `wrangler.toml` | Pages project config for direct upload |

### Caching note

`_headers` fingerprints nothing, so `assets/*` is served `immutable` for a year while HTML
revalidates on every request. If you edit a CSS or JS file, either rename it or purge the
Pages cache so returning visitors pick up the change.

---

## Local preview

Any static server works — there is no toolchain:

```bash
python3 -m http.server 8788
# or
npx wrangler pages dev .
```

Then open <http://127.0.0.1:8788>.

---

## Content and branding

- **Company:** TripM8 AI Inc. **Brand shown throughout the site:** TripM8
  (the domain stays tripm8.ai; only the displayed name was shortened.)
- **Logo:** the blue mountain-peak mark in `assets/img/logo.svg`
  (`logo-mark-white.svg` is the solid-white version for dark backgrounds,
  `favicon.svg` is the rounded app icon).
- **Colours** live as custom properties at the top of `assets/css/styles.css`
  (`--brand-500`, `--ink`, `--muted`, …). Change them there and the whole site follows.

### Swapping in real photography

Every image slot is a real photograph now; the only SVGs left are the logo files so the site deploys with no external requests and no image licensing.
Replace any of it by dropping your file in `assets/img/` and updating the matching
`<img src>` in `index.html`.

The hero photo keeps the original orientation, with the subject left of centre. The white
scrim in `.hero__media::after` is tuned around that: it holds near-opaque out to 36% and
clears by 68%, so the headline stays legible where it crosses her hair while the village on
the right reads through. If you swap in a different hero, expect to retune that gradient
together with `object-position` on `.hero__media img` — screens under 940px get their own,
softer pair, framed on the village rather than the subject.

Sizes below are what the browser actually renders at a 1440px-wide desktop viewport. Supply
source images at **2× those dimensions** so they stay sharp on retina screens. Every slot
marked *cover* is cropped to fill by `object-fit: cover`, so match the aspect ratio and keep
the subject centred.

| Placeholder | Where it appears | Rendered | Suggested source |
| --- | --- | --- | --- |
| `hero-santorini.jpg` | Hero background *(already a photo)* | 1440×512 *cover* | 2880×1024 (≈2.8:1) |
| `cta-sunset.jpg` | Closing "Future of Travel" band *(already a photo)* | 1440×337 *cover* | 2880×674 (≈4.3:1) |
| `scene-glasses.jpg` | "For Travelers" product panel *(already a photo)* | 244×276 *cover* | 600×678 (≈9:10, portrait) |
| `thumb-santorini.jpg` | Thumbnail in the hero chat mock *(already a photo)* | 76×76 *cover* | 320×320 (square) |
| `glasses.png` | AI Glasses product shot *(transparent PNG)* | 380×143 | 1140×429, alpha |
| `avatar-sarah.jpg` | Testimonial portrait *(already a photo)* | 38×38 *cover* | 200×200 (square) |
| `mock-itinerary.jpg` | Itinerary row in the dashboard mock | 26×26 *cover* | 200×200 (square) |
| `mock-poi.jpg` | Point-of-interest card in the glasses mock | 126×42 *cover* | 600×200 (3:1) |
| `sn-transport.jpg` | Supply card — Transportation | 126×86 *cover* | 600×410 |
| `sn-hotels.jpg` | Supply card — Hotels, and the hotel thumb in the glasses mock | 126×86 *cover* | 600×410 |
| `sn-tours.jpg` | Supply card — Tours | 126×86 *cover* | 600×410 |
| `sn-guides.jpg` | Supply card — Guides | 126×86 *cover* | 600×410 |
| `sn-activities.jpg` | Supply card — Activities | 126×86 *cover* | 600×410 |
| `sn-restaurants.jpg` | Supply card — Restaurants | 126×86 *cover* | 600×410 |

The "For Travelers" panel has four floating elements absolutely positioned over it — a
bubble top-right, the Colosseum card down the right side, a bubble mid-left and the hotel
card along the bottom. Only the left ~45% of that image stays visible, so keep your subject
in that band or it disappears behind the cards.

**The mock thumbnails name specific places**, so they have their own files rather than
borrowing a supply-network photo: `mock-itinerary.jpg` is Mount Fuji for the "Tokyo · Kyoto ·
Osaka" row, and `mock-poi.jpg` is the Colosseum for the "Colosseum, Rome" card. Keep the
picture and the label in step when you swap either.

`sn-hotels.jpg` is the one shared file: it backs both the Hotels supply card and the
"Hotel Artemide" thumb in the glasses mock. If you swap it, check both places.

**Two things to update alongside the hero image:**

1. The Open Graph tags in `<head>` point at the hero file and carry its dimensions —
   `og:image`, `og:image:width`, `og:image:height`. Keep all three in sync.
2. Each `<img>` carries `width`/`height` attributes that reserve layout space while loading.
   Update them to your file's real pixel dimensions so nothing shifts on load.
3. Strip EXIF before committing a photo — camera and GPS metadata otherwise ship to every
   visitor. `hero-santorini.jpg` was re-encoded through a clean buffer for this reason.

Decorative images use `alt=""` on purpose — screen readers skip them because the nearby text
already carries the meaning. Keep it that way unless the photo conveys something new. The
three with real alt text (`glasses.svg`, `scene-glasses.svg`, `thumb-santorini.svg`) should
get descriptions matching whatever you put there.

The glasses shot is a **PNG with an alpha channel**, not a JPEG: it sits on the band's grey
gradient, so a white studio background would show as a pale rectangle. The white sweep was
keyed out by flooding inwards from the corners, then dropping the large enclosed areas (the
lenses and the gap under the rim) while keeping the small specular highlights on the frame
opaque. If you replace it, supply a cut-out PNG rather than a JPEG on white.

Note that `.glasses__hero img` sets `height: auto`. Without it the browser honours the HTML
`height` attribute and the shot renders square.

Local files of any type are already allowed by the Content-Security-Policy in `_headers`
(`img-src 'self' data:`). If you load images from a remote CDN instead, add that origin to
the `img-src` directive or they will be blocked.

### Contact addresses

`hello@`, `privacy@` and `legal@tripm8.ai` are referenced in the markup — point them at real
mailboxes or swap them for a form before launch. The social links in the footer currently go
to the platforms' home pages; replace them with the real profile URLs.
