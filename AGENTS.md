# INSPOWER website – structure & maintenance guide

Static, dependency-free website for the INSPOWER dance studio (Meirav Sherer), Hebrew, RTL.
No build step. Hosted on GitHub Pages via the workflow in `.github/workflows/` (see Deployment); any static host can serve it as-is.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Homepage (דף הבית): hero, class types, about, testimonials, branches, CTA, footer |
| `schedule.html` | Weekly schedule (מערכת שעות), rendered from `data/schedule.json` by `js/schedule.js` |
| `error.html` | 404 page for unknown paths. Uses absolute (`/...`) asset and link paths so it works from any URL; `noindex`. Must be wired in the host config (see Deployment) |

Navigation (same in both pages, header + footer):
- דף הבית → `index.html`
- מערכת שעות → `schedule.html`
- חנות → external, currently `https://inspower.co.il/conf/`
- הרשמה → external, currently `https://inspower.co.il/sign/` (styled as CTA button)

The header and footer are duplicated verbatim in both HTML files. **When changing one, change both.**

## Directory layout

```
index.html          homepage
schedule.html       schedule page
error.html          404 page (absolute paths, noindex)
css/style.css       all styles (design tokens in :root, responsive rules at bottom)
js/main.js          mobile nav toggle
js/schedule.js      fetches data/schedule.json, renders grid (desktop) + list (mobile), filters, legend, notes
data/schedule.json  THE schedule data – edit this to change classes
assets/logo.svg     neon stamp logo (also favicon)
assets/hero.jpg     hero photo (also og:image)
design/             original source assets (reference only, not served)
.claude/launch.json dev server config (python3 -m http.server 8765)
```

## Editing the schedule (`data/schedule.json`)

```json
{
  "season": "2026-2027",              // badge + CTA text on schedule page (elements with data-season)
  "days": ["ראשון", ...],             // column order; index = `day` in classes (0 = ראשון)
  "branches": {
    "rishon": { "name": "...", "address": "...", "short": "..." }   // `short` shown on class card
  },
  "categories": { "kids": "ילדים ונוער", "troupe": "להקות", "women": "נשים" },  // filter chips
  "notes": ["* ...", "** ..."],       // footnotes under the grid
  "classes": [
    { "day": 0, "time": "16:00", "title": "...", "subtitle": "optional", "branch": "rishon", "category": "kids" }
  ]
}
```

Rules:
- `time` is `HH:MM` 24h; rows are generated from the distinct times present, sorted.
- `branch` must be a key in `branches`; `category` must be a key in `categories`.
- Branch colors are set in `css/style.css` via `[data-branch="<key>"] { --bc: ... }`.
  Adding a branch = add JSON entry + add a CSS color rule. Current: `rishon` = cyan, `marom` = purple.
- Number of columns follows `days` (CSS var `--days` set by JS). Currently ראשון–שישי.
- A day with no classes still renders as an empty column (hatched cells) on desktop and is skipped on mobile.
- Mobile (< 760px) uses the per-day list; desktop uses the time × day grid. Both come from the same data.
- `subtitle` conventions: `כולל מופע*` for groups in the end-of-year show, `**` for groups that need an aptitude check.

## Homepage content to keep in sync

When the schedule changes, also review in `index.html`:
- Hero stats (`.hero__stats`): number of branches, number of weekly groups.
- Hero kicker text (cities).
- "מה רוקדים אצלנו" cards – class types offered.
- "הסניפים שלנו" cards – one per branch with address and days (`data-branch` attr picks the color).
- Marquee strip text.

Season change checklist: update `season` in JSON (fills `[data-season]` elements on the schedule page), then search both HTML files for the old year string (registration labels in header/CTA, `<title>`, meta/og tags) and replace.

## Design system (css/style.css)

- Tokens in `:root`: `--bg`, `--purple`, `--magenta`, `--cyan`, `--grad`, fonts, radius.
- Dark neon theme matching the logo. Hero is a full-bleed photo (`assets/hero.jpg`) with a dark gradient overlay (`.hero::before`).
- Fonts: Heebo (body), Secular One (display) from Google Fonts.
- Breakpoints: 1000px (tablet), 760px (mobile – nav collapses to hamburger).
- Class names follow BEM-ish `block__element--modifier`.

## SEO

Each page has: `<title>`, description, keywords, canonical, Open Graph, Twitter card, and a JSON-LD
`DanceSchool` block (address, phone, socials). Canonical/OG URLs assume the site is served at
`https://inspower.co.il/`. Update the base URL in both files if the domain changes.
A `sitemap.xml` / `robots.txt` can be added at the root when deploying.

## Contact details (appear in footer + JSON-LD)

Phone 052-4280222 · info@inspower.co.il · Instagram/Facebook/TikTok/YouTube links in footer.

## Deployment

`.github/workflows/deploy.yml` runs on push to `main` (and manually via workflow_dispatch): builds `dist/`
(copies `index.html`, `schedule.html`, `error.html`, `css/`, `js/`, `data/`, `assets/`, plus `error.html` as
`404.html` and a `.nojekyll` marker), uploads it as a Pages artifact and deploys it with `actions/deploy-pages`.
**A new top-level file or folder that must be served has to be added to the "Build dist" step.**
`design/`, `AGENTS.md`, `.claude/` are never deployed.

Repo setting: Settings → Pages → Source = "GitHub Actions" (no branch publishing).
Custom domain: Settings → Pages → Custom domain = `inspower.co.il` (GitHub writes DNS instructions there; an
`A`/`ALIAS` record to GitHub Pages IPs plus `www` CNAME). When a custom domain is set, also add a `CNAME` file
step to the build (`echo inspower.co.il > dist/CNAME`) so it survives redeploys.

404: GitHub Pages serves `404.html` at the root for unknown paths – the build step creates it from `error.html`.
`error.html` uses absolute paths (`/css/...`), which assume the site is at the domain root (custom domain or a
`<user>.github.io` user site). On a project URL like `meiravsherer.github.io/website/` those paths break.

### 404 page on other hosts

`error.html` is only served for unknown paths if the host is told about it:
- Apache / cPanel: `.htaccess` → `ErrorDocument 404 /error.html`
- Nginx: `error_page 404 /error.html;`
- Netlify: rename/copy to `404.html` at the root (or `_redirects`: `/* /error.html 404`)
- GitHub Pages: must be named `404.html` at the root
- Cloudflare Pages: must be named `404.html` at the root

The error page links use absolute paths (`/`, `/schedule.html`, `/assets/...`) – keep it that way, since it is
served from arbitrary URLs/subfolders. The other pages use relative paths.

## Local preview

```bash
python3 -m http.server 8765
```
Then open http://localhost:8765/. Schedule page needs HTTP (fetches JSON), it won't work via `file://`.
