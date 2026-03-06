# Run the Test Suite

Run unit tests and/or Playwright E2E tests to verify the codebase.

## Prerequisites

Dependencies must be installed first. Run `/install` if you haven't already.

## Unit tests (Jest) — no server needed

Fast feedback, no Jekyll server required:

```bash
npm run test:unit
```

Covers 19 tests across two modules:
- **`js/snake-dqn.js`** — `oneHotState()`, `transferWeightsFromGraphModel()`
- **`js/segmentation.js`** — `normalizeCoords()`, `getMaskColor()`, `buildSamInputs()`, `parseHsla()`, `hslToRgb()`

## E2E tests (Playwright) — builds site + starts server automatically

```bash
npm test
```

Runs all 40 Playwright tests. The server starts automatically via `playwright.config.js`.

## All tests (unit + E2E)

```bash
npm run test:all
```

## Other E2E options

```bash
npm run test:headed   # show browser window while tests run
npm run test:ui       # interactive Playwright UI mode
npm run test:report   # view HTML report from the last run
```

## Rake equivalents

```bash
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test        # build + unit + E2E (default)
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test:unit   # unit tests only
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test:e2e    # E2E only (server must be running)
```

## What's tested (E2E)

- **Homepage** — hero section, skill pills, projects, avatar, nav/footer
- **About** — loads, title, bio content
- **Chat** — loads, H1 heading, chat status bar
- **Snake RL** — loads, H1 heading, canvas element
- **Language Model** — loads, H1 heading, generate button
- **Tags** — loads, title
- **404** — page exists
- **Blog post** — loads, title, content
- **Common layout** — viewport meta, nav, footer on every page
- **RSS feed** — 200 response, valid XML, contains blog entry
