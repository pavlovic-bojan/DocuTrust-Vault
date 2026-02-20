import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Page object for the main app layout (after login). Admin lands on /, User on /documents. */
export class AppLayoutPage extends BasePage {
  readonly layoutMain = '[data-test="layout-main"]';

  constructor(page: Page) {
    super(page);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.waitForVisible(this.layoutMain);
  }
}
