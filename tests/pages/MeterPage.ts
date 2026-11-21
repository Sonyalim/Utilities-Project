import type { Page } from '@playwright/test';

export class MeterPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByRole('button', { name: 'Meters' }).click();
  }

  meterRow(meterId: string) {
    return this.page.getByRole('row').filter({ hasText: meterId });
  }
}
