import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    const passwordField = this.page.getByLabel('Password');
    await passwordField.fill(password);
    await passwordField.press('Enter');
  }
}
