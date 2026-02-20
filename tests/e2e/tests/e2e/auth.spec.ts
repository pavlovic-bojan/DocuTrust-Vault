import { test, expect } from '@playwright/test';
import { LoginPage, AppLayoutPage } from '../../pages';

test.describe('Auth E2E Tests - DocuTrust Vault', () => {
  test('should show login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');

    await expect(page.locator(loginPage.errorMessage)).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully and redirect to app (Admin -> /, User -> /documents)', async ({
    page,
  }) => {
    const email = process.env.TEST_USER_EMAIL ?? 'admin@doctrust.local';
    const password = process.env.TEST_USER_PASSWORD ?? 'Admin123!';

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    await expect(page).toHaveURL(/\/(documents)?$/);
    const appLayout = new AppLayoutPage(page);
    await appLayout.verifyPageLoaded();
  });
});
