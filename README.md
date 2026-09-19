# TripM8.ai

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

- **Company:** TripM8 AI Inc. **Brand shown on site:** TripM8.ai
- **Logo:** the blue mountain-peak mark in `assets/img/logo.svg`
  (`logo-mark-white.svg` is the solid-white version for dark backgrounds,
  `favicon.svg` is the rounded app icon).
- **Colours** live as custom properties at the top of `assets/css/styles.css`
  (`--brand-500`, `--ink`, `--muted`, …). Change them there and the whole site follows.

### Swapping in real photography

Three slots already use real photographs: the hero (`hero-santorini.jpg`, 1550×950), the
thumbnail in its chat mock (`thumb-santorini.jpg`, 320×320) and the "For Travelers" panel
(`scene-glasses.jpg`, 600×678). Everything else — the AI Glasses product shot, the six
supply-network thumbnails, the closing band and the testimonial portrait — is still
**illustrated SVG** so the site deploys with no external requests and no image licensing.
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
| `cta-sunset.svg` | Closing "Future of Travel" band | 1440×337 *cover* | 2880×674 (≈4.3:1) |
| `scene-glasses.jpg` | "For Travelers" product panel *(already a photo)* | 244×276 *cover* | 600×678 (≈9:10, portrait) |
| `thumb-santorini.jpg` | Thumbnail in the hero chat mock *(already a photo)* | 76×76 *cover* | 320×320 (square) |
| `glasses.svg` | AI Glasses product shot | 380×150 | Transparent PNG, 1140×450 |
| `avatar-sarah.svg` | Testimonial portrait | 38×38 *cover* | 160×160 (square) |
| `sn-guides.svg` | Supply card — Guides | 126×86 *cover* | 504×344 (≈3:2) |
| `sn-restaurants.svg` | Supply card — Restaurants | 126×86 *cover* | 504×344 (≈3:2) |
| `sn-transport.svg` | Supply card — Transportation | 126×86 *cover* | 504×344 (≈3:2) |

The "For Travelers" panel has four floating elements absolutely positioned over it — a
bubble top-right, the Colosseum card down the right side, a bubble mid-left and the hotel
card along the bottom. Only the left ~45% of that image stays visible, so keep your subject
in that band or it disappears behind the cards.

**Three files are used twice.** Replacing one changes both places at once:

| Placeholder | Use 1 | Use 2 |
| --- | --- | --- |
| `sn-hotels.svg` | Supply card — Hotels, 126×86 | "Hotel Artemide" thumb in the glasses mock, 30×30 |
| `sn-tours.svg` | Supply card — Tours, 126×86 | Itinerary row in the dashboard mock, 26×26 |
| `sn-activities.svg` | Supply card — Activities, 126×86 | "Colosseum" card in the glasses mock, 126×42 |

That reuse is intentional and usually fine — a 3:2 photo crops acceptably to a small square.
If you want different photos in the mocks, add separate files and point only those `<img>`
tags at them.

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

Local files of any type are already allowed by the Content-Security-Policy in `_headers`
(`img-src 'self' data:`). If you load images from a remote CDN instead, add that origin to
the `img-src` directive or they will be blocked.

### Contact addresses

`hello@`, `privacy@` and `legal@tripm8.ai` are referenced in the markup — point them at real
mailboxes or swap them for a form before launch. The social links in the footer currently go
to the platforms' home pages; replace them with the real profile URLs.
