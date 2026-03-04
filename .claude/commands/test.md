# Run the Test Suite

Run the Playwright E2E tests to verify all pages load correctly.

## Prerequisites

Dependencies must be installed first. Run `/install` if you haven't already.

## Run all tests (build + test)

```bash
PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" rake test
```

This builds the Jekyll site to `_site/` then runs all 40 Playwright tests.

## Run tests against a running server

If Jekyll is already serving on port 4000 (via `/serve`):

```bash
/opt/node22/bin/playwright test
```

## Other options

```bash
/opt/node22/bin/playwright test --headed   # show browser window
/opt/node22/bin/playwright test --ui       # interactive UI mode
/opt/node22/bin/playwright show-report     # view last test report
```

## What's tested

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
