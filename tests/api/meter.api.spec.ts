import { expect, test } from '@playwright/test';

test('returns a healthy status', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});

test('lists the seeded meters', async ({ request }) => {
  const response = await request.get('/api/meters');

  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  const meters = await response.json();
  expect(meters).toContainEqual({
    id: 'MTR-1001',
    customerId: 'CUS-1001',
    reading: 1250,
    status: 'active',
  });
});

test('gets one meter by ID', async ({ request }) => {
  const response = await request.get('/api/meters/MTR-1001');

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    id: 'MTR-1001',
    customerId: 'CUS-1001',
    reading: 1250,
    status: 'active',
  });
});

test('creates a meter for an existing customer', async ({ request }) => {
  const response = await request.post('/api/meters', {
    data: { customerId: 'CUS-1002', reading: 932 },
  });

  expect(response.status()).toBe(201);
  const meter = await response.json();
  expect(meter).toMatchObject({
    customerId: 'CUS-1002',
    reading: 932,
    status: 'active',
  });
  expect(meter.id).toMatch(/^MTR-/);
});

test('rejects a negative meter reading', async ({ request }) => {
  const response = await request.post('/api/meters', {
    data: { customerId: 'CUS-1001', reading: -1 },
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
});

test('returns 404 for an unknown meter', async ({ request }) => {
  const response = await request.get('/api/meters/does-not-exist');

  expect(response.status()).toBe(404);
});
