import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput = '[data-test="input-email"]';
  readonly passwordInput = '[data-test="input-password"]';
  readonly submitButton = '[data-test="button-submit"]';
  readonly loginForm = '[data-test="form-login"]';
  readonly errorMessage = '[data-test="error-message"]';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/login');
    await this.verifyPageLoaded();
  }

  async verifyPageLoaded(): Promise<void> {
    await this.waitForVisible(this.loginForm);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
    await this.waitForLoad();
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}
