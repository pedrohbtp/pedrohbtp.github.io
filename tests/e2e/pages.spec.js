// @ts-check
const { test, expect } = require('/opt/node22/lib/node_modules/playwright/test.js');

// Jekyll outputs every page as a directory index (pretty URLs).
// e.g. chat.html → /chat/   aboutme.md → /aboutme/
//
// Pages with `use-site-title: true` in their front matter use the site
// description as the <title>; their page title appears in <h1> instead.

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------
test.describe('Homepage (/)', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pedro Borges Torres/);
  });

  test('renders hero section with name and tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-section')).toBeVisible();
    await expect(page.locator('.hero-name')).toContainText('Pedro Borges Torres');
    await expect(page.locator('.hero-tagline')).toContainText('Software Engineer');
  });

  test('displays skill pills', async ({ page }) => {
    await page.goto('/');
    const pills = page.locator('.skill-pill');
    await expect(pills.first()).toBeVisible();
    await expect(pills).toHaveCount(7); // Python, PyTorch, LLMs, AWS, Cloud, Backend, Machine Learning
  });

  test('has navigation bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('has footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });

  test('shows projects section', async ({ page }) => {
    await page.goto('/');
    // Project items use class "item-name" for their titles
    await expect(page.locator('.item-name').first()).toBeVisible();
  });

  test('avatar image loads', async ({ page }) => {
    await page.goto('/');
    const avatar = page.locator('img[src*="me.jpg"], img[src*="me.jpeg"]').first();
    await expect(avatar).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// About Me page
// ---------------------------------------------------------------------------
test.describe('About Me page (/aboutme/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/aboutme/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/aboutme/');
    await expect(page).toHaveTitle(/About me/i);
  });

  test('contains bio text', async ({ page }) => {
    await page.goto('/aboutme/');
    await expect(page.locator('body')).toContainText('UCLA');
  });

  test('has navigation bar', async ({ page }) => {
    await page.goto('/aboutme/');
    await expect(page.locator('nav')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Local AI Chat page
// ---------------------------------------------------------------------------
test.describe('Chat page (/chat/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/chat/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct page heading (h1)', async ({ page }) => {
    // use-site-title: true puts site desc in <title>; page title is in <h1>
    await page.goto('/chat/');
    await expect(page.locator('h1')).toContainText('Local AI Chat');
  });

  test('renders chat status bar', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#status-bar, .chat-status')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Snake Game AI page
// ---------------------------------------------------------------------------
test.describe('Snake RL page (/snake-rl/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/snake-rl/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct page heading (h1)', async ({ page }) => {
    await page.goto('/snake-rl/');
    await expect(page.locator('h1')).toContainText('Snake Game AI');
  });

  test('contains game canvas', async ({ page }) => {
    await page.goto('/snake-rl/');
    await expect(page.locator('canvas')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Language Model page
// ---------------------------------------------------------------------------
test.describe('Language Model page (/language-model/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/language-model/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct page heading (h1)', async ({ page }) => {
    await page.goto('/language-model/');
    await expect(page.locator('h1')).toContainText('Language Model');
  });

  test('contains Generate Text link', async ({ page }) => {
    await page.goto('/language-model/');
    // The generate action is an <a> with onclick, not a <button>
    await expect(page.locator('a:has-text("Generate"), a.btn')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tag Index page
// ---------------------------------------------------------------------------
test.describe('Tags page (/tags/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/tags/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/tags/');
    await expect(page).toHaveTitle(/Tag Index/i);
  });
});

// ---------------------------------------------------------------------------
// 404 page
// ---------------------------------------------------------------------------
test.describe('404 page (/404.html)', () => {
  test('404 page exists and loads', async ({ page }) => {
    const response = await page.goto('/404.html');
    expect(response?.status()).toBeLessThan(500);
  });

  test('404 page has content', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ---------------------------------------------------------------------------
// Blog post
// ---------------------------------------------------------------------------
test.describe('Blog post (/2015-01-04-first-post/)', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/2015-01-04-first-post/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('has correct title', async ({ page }) => {
    await page.goto('/2015-01-04-first-post/');
    await expect(page).toHaveTitle(/First post/i);
  });

  test('shows post content', async ({ page }) => {
    await page.goto('/2015-01-04-first-post/');
    await expect(page.locator('body')).toContainText('first post');
  });
});

// ---------------------------------------------------------------------------
// Common layout checks
// ---------------------------------------------------------------------------
test.describe('Common layout', () => {
  const pages = [
    { name: 'homepage', path: '/' },
    { name: 'about', path: '/aboutme/' },
    { name: 'chat', path: '/chat/' },
  ];

  for (const { name, path } of pages) {
    test(`${name}: has non-empty <title>`, async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });

    test(`${name}: has viewport meta tag`, async ({ page }) => {
      await page.goto(path);
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    test(`${name}: has navigation and footer`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  }
});
