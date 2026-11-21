# Requirements

1. [REQ-01] The health endpoint `GET /api/health` returns HTTP 200 and a JSON status of `ok`.
2. [REQ-02] The meter collection endpoint `GET /api/meters` returns the seeded meters with their IDs, customer IDs, readings, and statuses.
3. [REQ-03] The meter detail endpoint `GET /api/meters/{id}` returns the matching meter when the ID exists.
4. [REQ-04] Creating a meter for an existing customer with a non-negative numeric reading returns HTTP 201 and the created meter.
5. [REQ-05] Creating a meter with a negative reading is rejected with HTTP 400.
6. [REQ-06] Requesting a meter ID that does not exist returns HTTP 404.
7. [REQ-07] The portal displays a sign-in form with labeled username and password fields.
8. [REQ-08] Submitting the valid demo credentials displays the authenticated portal dashboard.
9. [REQ-09] The meters view displays the seeded meter ID and reading.
10. [REQ-10] The customers view displays the seeded customer ID and name.
