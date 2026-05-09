# chiamck.site

Personal site for Chiam Chee Kong — Head of Data & AI, M1 Limited.

Hand-built static site, served via GitHub Pages on the `chiamck.site` apex
domain.

## Structure

```
.
├── index.html          # main folio page
├── resume.html         # printable résumé (uses browser Print → Save as PDF)
├── assets/
│   ├── styles.css
│   └── favicon.svg
├── CNAME               # apex domain for Pages
├── .nojekyll           # disables Jekyll on Pages
├── robots.txt
└── sitemap.xml
```

## Local preview

Any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Pushes to `main` are served by GitHub Pages.

### DNS — pointing chiamck.site at GitHub Pages

At your domain registrar, set the following records on `chiamck.site`:

**Apex (`@`) — A records (all four):**

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Optional: AAAA records for IPv6 — `@`:**

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**`www` — CNAME:**

```
www  →  samurai-bot.github.io
```

After DNS propagates (a few minutes to ~24 hours), GitHub will issue a
Let's Encrypt certificate automatically. In the repo's **Settings → Pages**
make sure **Enforce HTTPS** is enabled.

## Type

Display: **Fraunces** (variable serif).
Body: **IBM Plex Sans**.
Mono: **JetBrains Mono**.
