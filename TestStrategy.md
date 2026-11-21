# Test Strategy

## Purpose and scope

This strategy covers the local Utility Meter Portal demo: its health, meter, and customer API endpoints, plus the sign-in, meter, and customer views. It is an executable starter strategy for this demo, not a production security or load-test plan.

## Test levels and approach

- **API (Playwright APIRequest):** Verify HTTP status, response content, successful meter creation, invalid reading rejection, and missing-resource behavior. API tests run independently of browser UI tests.
- **UI (Playwright):** Use page objects for login, meters, and customers. Verify the sign-in form, successful demo login, and seeded records in the two views.
- **BDD (playwright-bdd):** AI-generated feature files are drafts only. A human must review and refine each scenario and implement or verify its step definitions before the feature is moved into the configured `features/` directory and included in a test run.

## Environment and test data

Playwright starts the local app from `app/server.js` on `http://127.0.0.1:4173`. The server uses in-memory seeded customers and meters; changes made by a test do not persist across server restarts. The UI demo credentials are `meteradmin` / `Meter123` and are not production credentials. Optional `BASE_URL` and `API_URL` values can override the default addresses.

## Execution

- API only: `npx playwright test --project=api`
- UI headed: `npx playwright test --project=ui --headed`
- Full suite and BDD generation: `npm test`

The HTML report is written to `reports/html`, and JUnit results to `reports/junit.xml`.

## Risks and exit criteria

The demo has no persistent database, authorization service, or external integrations; passing tests only demonstrate the local sample behavior. A run is accepted when all applicable Playwright tests pass, TypeScript type-checking succeeds, and the HTML and JUnit reports are generated. AI-generated scenarios require human review and are not considered accepted test coverage until their steps are implemented and the scenarios pass.
