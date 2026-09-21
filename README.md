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

### Option B — direct upload

Drag the repository folder onto the Pages dashboard's upload area, or run:

```bash
npx wrangler pages deploy . --project-name=tripm8ai
```

**Do not add a `wrangler.toml` to the repository root.** The drag-and-drop uploader treats a
wrangler config as a signal that the project needs a build and refuses it with *"This
uploader does not yet support projects that require a build process."* The site has no build
step, so it does not need the file — `wrangler pages deploy` takes the project name on the
command line instead.

### Custom domain

Pages project → **Custom domains** → add `tripm8.ai` and `www.tripm8.ai`. If the domain's
DNS is already on Cloudflare the records are created for you; TLS is issued automatically.

---

## AI Glasses waitlist — MVP validation survey

"Join the Waitlist" opens a three-step survey (`#waitlist`) built to test the product idea,
not just collect addresses. Each step answers one validation question:

| Step | Asks | Tells you |
| --- | --- | --- |
| 1 · About you | Travel frequency, traveller vs travel business | Who is actually showing up, and whether they match the target user |
| 2 · What's hard | Frictions abroad (multi-select), which capability they'd reach for first | Whether the problem is real, and **what to build first** |
| 3 · Would you buy | Price band, beta-tester opt-in, email, what it must do | **Willingness to pay** — the honest signal — plus a committed test group |

Nothing needs typing until step 3, which keeps the drop-off honest rather than filtering for
patient people.

### Every step is saved

The browser mints a `response_id` and the form POSTs after each step, so someone who quits at
step 2 still leaves their answers behind and `last_step` records where they stopped. **Funnel
drop-off is itself a validation signal** — if most people bail at the price question, that is
the finding.

Submissions go to `POST /api/waitlist`, a Cloudflare Pages Function writing to D1.

### One-time setup

Until the binding exists the endpoint answers **503** and nothing is stored — it fails loudly
rather than dropping answers silently.

```bash
npx wrangler d1 create tripm8-waitlist
npx wrangler d1 execute tripm8-waitlist --remote --file=./schema.sql
```

Then in the Pages project: **Settings → Functions → D1 database bindings**, add variable name
`WAITLIST_DB` pointing at `tripm8-waitlist`. Add it to **both** Production and Preview, then
redeploy.

> Functions need a deploy route that supports them: the Git integration and
> `npx wrangler pages deploy .` both do. If the dashboard's drag-and-drop uploader ignores or
> rejects the `functions/` directory, use one of those two — the static pages work either
> way, only the form endpoint depends on it.

### Reading the answers

```bash
d1() { npx wrangler d1 execute tripm8-waitlist --remote --command="$1"; }

# Would anyone pay? The single most useful number.
d1 "SELECT price, COUNT(*) n FROM waitlist WHERE completed=1 GROUP BY price ORDER BY n DESC"

# What do we build first?
d1 "SELECT first_use, COUNT(*) n FROM waitlist WHERE first_use IS NOT NULL GROUP BY first_use ORDER BY n DESC"

# Is the problem real? (frictions is a comma-separated set)
d1 "SELECT 'language' tag, COUNT(*) n FROM waitlist WHERE frictions LIKE '%language%'
    UNION ALL SELECT 'food',           COUNT(*) FROM waitlist WHERE frictions LIKE '%food%'
    UNION ALL SELECT 'getting-around', COUNT(*) FROM waitlist WHERE frictions LIKE '%getting-around%'
    UNION ALL SELECT 'booking',        COUNT(*) FROM waitlist WHERE frictions LIKE '%booking%'
    UNION ALL SELECT 'context',        COUNT(*) FROM waitlist WHERE frictions LIKE '%context%'
    UNION ALL SELECT 'none',           COUNT(*) FROM waitlist WHERE frictions LIKE '%none%'
    ORDER BY n DESC"

# Where does the funnel leak?
d1 "SELECT last_step, COUNT(*) n, SUM(completed) finished FROM waitlist GROUP BY last_step ORDER BY last_step"

# Who will actually test it
d1 "SELECT email, price, first_use, note FROM waitlist WHERE beta=1 AND completed=1 ORDER BY created_at DESC"

# Do frequent travellers value it more than occasional ones?
d1 "SELECT trips, price, COUNT(*) n FROM waitlist WHERE completed=1 GROUP BY trips, price ORDER BY trips, n DESC"

# Verbatims — usually where the real insight is
d1 "SELECT note, price, role FROM waitlist WHERE note IS NOT NULL ORDER BY created_at DESC LIMIT 30"
```

### Behaviour worth knowing

- **Works without JavaScript.** All three steps render at once and post together; the
  Function mints the `response_id` server-side and returns a styled confirmation page.
- **Only the email is required**, and only on step 3. Every other answer may be skipped, and
  skipping is recorded as `NULL` rather than guessed at.
- **Answering twice with the same address** folds the new answers into the existing row and
  deletes the duplicate, so one person stays one row.
- **Spam:** a hidden honeypot field. Bots that fill it get a plausible success response and
  nothing is written.
- **Stored:** the answers, the optional note (capped at 280 chars) and the Cloudflare country
  code. No IP address. Every choice is validated against a fixed list, so anything else
  becomes `NULL`.
- The privacy policy already tells visitors that joining a waitlist means giving us an email.

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
| `assets/img/*` | Logo and all artwork |
| `functions/api/waitlist.js` | Pages Function receiving waitlist signups |
| `schema.sql` | D1 table for the waitlist |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO / PWA metadata |

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
