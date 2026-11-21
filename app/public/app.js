const loginView = document.querySelector('#login-view');
const dashboard = document.querySelector('#dashboard');
const errorMessage = document.querySelector('#error');
const metersView = document.querySelector('#meters-view');
const customersView = document.querySelector('#customers-view');

document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const valid = form.get('username') === 'meteradmin' && form.get('password') === 'Meter123';
  errorMessage.hidden = valid;
  if (valid) {
    loginView.hidden = true;
    dashboard.hidden = false;
  }
});

async function loadTable(endpoint, target, fields) {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Could not load ${endpoint}.`);
  const records = await response.json();
  target.replaceChildren(...records.map((record) => {
    const row = document.createElement('tr');
    for (const field of fields) {
      const cell = document.createElement('td');
      cell.textContent = record[field];
      row.append(cell);
    }
    return row;
  }));
}

document.querySelector('#meters-tab').addEventListener('click', async () => {
  await loadTable('/api/meters', document.querySelector('#meters-list'), ['id', 'customerId', 'reading', 'status']);
  metersView.hidden = false;
  customersView.hidden = true;
});

document.querySelector('#customers-tab').addEventListener('click', async () => {
  await loadTable('/api/customers', document.querySelector('#customers-list'), ['id', 'name', 'email']);
  customersView.hidden = false;
  metersView.hidden = true;
});
