# Run the Jekyll Dev Server

Build and serve the site locally at http://localhost:4000.

## Prerequisites

Dependencies must be installed first. Run `/install` if you haven't already.

## Start the server

```bash
JEKYLL_NO_BUNDLER_REQUIRE=true \
  /opt/rbenv/versions/3.3.6/bin/jekyll serve \
  --port 4000 \
  --destination /home/user/jekyll_site
```

- `JEKYLL_NO_BUNDLER_REQUIRE=true` — skips Bundler (Gemfile.lock is incompatible with Ruby 3.3)
- `--destination /home/user/jekyll_site` — writes the built site outside the repo to avoid polluting it

The server auto-regenerates on file changes. Visit http://localhost:4000 in your browser.

## Take a screenshot of a page

After the server is running, use Playwright (already installed at `/opt/node22/bin/playwright`)
to capture a screenshot:

```bash
node -e "
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  try {
    await page.goto('http://localhost:4000/chat/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  } catch(e) {}
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/user/screenshot.png' });
  await browser.close();
  console.log('Saved to /home/user/screenshot.png');
})();
"
```

Replace `/chat/` with any path you want to capture.

## Stop the server

```bash
pkill -f "jekyll serve"
```
