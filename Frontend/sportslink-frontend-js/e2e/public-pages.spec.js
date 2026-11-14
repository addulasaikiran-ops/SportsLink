const { test, expect } = require('@playwright/test');

const publicPages = [
  { path: '/', label: 'landing page' },
  { path: '/about', label: 'about page' },
  { path: '/login', label: 'login page' },
  { path: '/signup', label: 'signup page' },
  { path: '/privacy', label: 'privacy page' },
];

for (const route of publicPages) {
  test(`public ${route.label} loads in Chromium`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response, `No document response for ${route.path}`).not.toBeNull();
    expect(response.status(), `${route.path} returned an unexpected status`).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
  });
}

test('login page exposes its main heading and form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /good to have/i })).toBeVisible();
  await expect(page.locator('form')).toBeVisible();
});

test('signup page exposes its main heading and form', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /your next chapter/i })).toBeVisible();
  await expect(page.locator('form')).toBeVisible();
});

test('protected workspace redirects to the setup/login route without Supabase configuration', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login\?setup=supabase/);
  await expect(page.getByRole('heading', { name: /good to have/i })).toBeVisible();
});

test('unknown workspace section returns the not-found page', async ({ page }) => {
  const response = await page.goto('/not-a-real-sportslink-section');
  expect(response).not.toBeNull();
  expect(response.status()).toBe(404);
});
