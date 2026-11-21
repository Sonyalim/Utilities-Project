const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const port = Number(process.env.PORT ?? 4173);
const publicDirectory = path.join(__dirname, 'public');
const customers = [
  { id: 'CUS-1001', name: 'Alex Morgan', email: 'alex.morgan@example.test' },
  { id: 'CUS-1002', name: 'Jamie Lee', email: 'jamie.lee@example.test' },
];
const meters = [
  { id: 'MTR-1001', customerId: 'CUS-1001', reading: 1250, status: 'active' },
  { id: 'MTR-1002', customerId: 'CUS-1002', reading: 840, status: 'active' },
];

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/meters') {
    sendJson(response, 200, meters);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/customers') {
    sendJson(response, 200, customers);
    return;
  }

  const meterMatch = url.pathname.match(/^\/api\/meters\/([^/]+)$/);
  if (request.method === 'GET' && meterMatch) {
    const meter = meters.find((item) => item.id === meterMatch[1]);
    sendJson(response, meter ? 200 : 404, meter ?? { error: 'Meter not found.' });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/meters') {
    let payload;
    try {
      payload = await readJson(request);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
      return;
    }

    if (
      typeof payload.customerId !== 'string' ||
      !customers.some((customer) => customer.id === payload.customerId) ||
      typeof payload.reading !== 'number' ||
      !Number.isFinite(payload.reading) ||
      payload.reading < 0
    ) {
      sendJson(response, 400, { error: 'A valid customerId and non-negative reading are required.' });
      return;
    }

    const meter = {
      id: `MTR-${randomUUID()}`,
      customerId: payload.customerId,
      reading: payload.reading,
      status: 'active',
    };
    meters.push(meter);
    sendJson(response, 201, meter);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fs.readFileSync(path.join(publicDirectory, 'index.html')));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/app.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(fs.readFileSync(path.join(publicDirectory, 'app.js')));
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(port, '127.0.0.1');
