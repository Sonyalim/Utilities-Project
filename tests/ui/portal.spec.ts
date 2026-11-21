import { expect, test } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage';
import { LoginPage } from '../pages/LoginPage';
import { MeterPage } from '../pages/MeterPage';

test('signs in and views meter and customer details', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const meterPage = new MeterPage(page);
  const customerPage = new CustomerPage(page);

  await loginPage.open();
  await expect(page.getByRole('heading', { name: 'Utility Meter Portal' })).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await loginPage.login('meteradmin', 'Meter123');
  await expect(page.getByText('Welcome, meteradmin')).toBeVisible();

  await meterPage.open();
  await expect(meterPage.meterRow('MTR-1001')).toContainText('1250');

  await customerPage.open();
  await expect(customerPage.customerRow('CUS-1001')).toContainText('Alex Morgan');
});
