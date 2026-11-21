import type { Page } from '@playwright/test';

export class CustomerPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByRole('button', { name: 'Customers' }).click();
  }

  customerRow(customerId: string) {
    return this.page.getByRole('row').filter({ hasText: customerId });
  }
}
