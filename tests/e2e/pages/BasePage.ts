import type { Page } from '@playwright/test';

/**
 * Base Page Object for all E2E pages.
 * All page objects MUST extend this class.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to baseURL */
  protected async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  /** Wait for element to be visible */
  protected async waitForVisible(selector: string, timeout = 10000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /** Click element by selector */
  protected async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  /** Fill input by selector */
  protected async fill(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  /** Check if element is visible */
  protected async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /** Wait for navigation/load to complete */
  protected async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Must be implemented by each page - verifies page loaded correctly */
  abstract verifyPageLoaded(): Promise<void>;
}
