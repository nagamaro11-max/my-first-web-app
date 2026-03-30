# CLAUDE.md

## Project Overview

A minimal static website hosted on GitHub Pages. The site is a single-page HTML project with no build tools, frameworks, or dependencies.

**Repository:** `nagamaro11-max/my-first-web-app`

## Directory Structure

```
.
├── CLAUDE.md       # AI assistant guidelines (this file)
└── index.html      # Main (and only) webpage
```

## Tech Stack

- **Language:** Plain HTML5
- **Hosting:** GitHub Pages
- **Build system:** None — static files served directly

## Development

### Local Preview

Open `index.html` directly in a browser, or use any local HTTP server:

```sh
# Python
python3 -m http.server 8000

# Node.js (if available)
npx serve .
```

### Deployment

The site deploys automatically via GitHub Pages when changes are pushed to `main`.

## Code Conventions

- Use semantic HTML5 elements
- Include `charset="UTF-8"` and responsive viewport meta tag in all HTML pages
- Keep files minimal — no unnecessary frameworks or build tooling
- No external dependencies unless explicitly needed

## Guidelines for AI Assistants

- This is a simple static site — avoid introducing build tools, bundlers, or package managers unless the user requests them
- When adding new pages, follow the existing HTML5 boilerplate pattern in `index.html`
- Test changes by verifying valid HTML structure; there are no automated tests
- Do not add `node_modules`, `package.json`, or other tooling files without being asked
