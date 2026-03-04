// @ts-check
const { test, expect } = require('/opt/node22/lib/node_modules/playwright/test.js');

// ---------------------------------------------------------------------------
// RSS Feed (/feed.xml)
// ---------------------------------------------------------------------------
test.describe('RSS Feed (/feed.xml)', () => {
  test('responds with 200', async ({ request }) => {
    const response = await request.get('/feed.xml');
    expect(response.status()).toBe(200);
  });

  test('returns XML content type', async ({ request }) => {
    const response = await request.get('/feed.xml');
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/xml|rss|atom/i);
  });

  test('contains valid XML with feed entries', async ({ request }) => {
    const response = await request.get('/feed.xml');
    const body = await response.text();

    // Root element is <feed> (Atom) or <rss>
    expect(body).toMatch(/<feed|<rss/i);

    // Should contain the site title
    expect(body).toContain('Pedro Borges Torres');

    // Should contain at least one entry/item (the 2015 blog post)
    expect(body).toMatch(/<entry>|<item>/i);
  });

  test('feed entry links back to the blog post', async ({ request }) => {
    const response = await request.get('/feed.xml');
    const body = await response.text();
    expect(body).toContain('first-post');
  });
});
