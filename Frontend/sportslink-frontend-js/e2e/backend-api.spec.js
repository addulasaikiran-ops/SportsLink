const { test, expect } = require('@playwright/test');

const apiBaseURL = process.env.API_BASE_URL;

test.describe('Spring Boot API smoke checks', () => {
  test.skip(!apiBaseURL, 'Set API_BASE_URL when the Spring Boot service is running.');

  test('public health endpoint reports UP', async ({ request }) => {
    const response = await request.get(`${apiBaseURL}/api/health`);
    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
    const payload = await response.json();
    expect(payload.status).toBe('UP');
  });

  test('protected identity endpoint rejects anonymous requests', async ({ request }) => {
    const response = await request.get(`${apiBaseURL}/api/me`);
    expect([401, 403]).toContain(response.status());
  });
});
