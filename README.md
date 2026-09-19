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

All the scenery — the hero, the product panels, the six supply-network thumbnails and the
closing band — is **illustrated SVG** so the site deploys with zero external requests and
no image licensing. To use real photos instead, drop your files in `assets/img/` and update
the matching `<img src>` in `index.html`:

| Placeholder | Used for |
| --- | --- |
| `hero-santorini.svg` | Hero background |
| `thumb-santorini.svg` | Card thumbnail in the hero chat mock |
| `scene-glasses.svg` | "For Travelers" product panel |
| `glasses.svg` | AI Glasses product shot |
| `sn-*.svg` | Supply-network thumbnails |
| `cta-sunset.svg` | Closing band background |
| `avatar-sarah.svg` | Testimonial portrait |

Keep the `width`/`height` attributes roughly proportional so nothing shifts while loading.
If you add remote images, widen the `img-src` directive in `_headers`.

### Contact addresses

`hello@`, `privacy@` and `legal@tripm8.ai` are referenced in the markup — point them at real
mailboxes or swap them for a form before launch. The social links in the footer currently go
to the platforms' home pages; replace them with the real profile URLs.
