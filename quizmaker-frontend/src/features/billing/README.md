# Checkout confirmation and reload recovery

The confirmation page reconciles an existing purchase using authenticated backend
reads. It never creates a checkout, infers credit from a redirect, or adds token
amounts to a local balance. Prices and purchase requests are unchanged.

## Return capture and account ownership

The existing `index.html` bootstrap and `SensitiveUrlBoundary` immediately remove
query strings and fragments, before analytics can see them. Other return flows
continue to use the one-time `useSensitiveReturn` behavior.

Billing alone transfers its captured reference into
`quizzence:billing:checkout-recovery:v1` in session storage, after the authenticated
account is known. The versioned record contains only the account ID, checkout
reference, and original capture timestamp. Its five-minute expiry never slides
on reload, manual retry, or repeated capture of the same active reference.

`CheckoutRecoveryLifecycle`, mounted under `AuthProvider`, removes recovery on
session transitions (including remote logout/account changes), account mismatch,
or expiry even when the confirmation page is no longer mounted. A completed
credit, failed payment, full/partial refund, or inaccessible checkout clears it.
Expired and malformed records are discarded on read. Browser timers can be
suspended in a background tab; the timestamp is always rechecked before reuse.
Storage is not an authorization boundary: the backend still enforces ownership.

If storage becomes unavailable after capture, reconciliation may continue in
page memory, but reload recovery is unavailable. A missing reference leads to
billing history/support guidance, never an instruction to purchase again.

## Bounded reconciliation

`useCheckoutReconciliation` owns the request, timers, and browser subscriptions.
Arrival/reload or **Check again** starts at most ten automatic status requests in
three minutes, subject to the original recovery expiry. Delays after responses
are 2, 4, 6, 10, 16, 24, 32, 40, and 44 seconds. With immediate responses, checks
occur at 0, 2, 6, 12, 22, 38, 62, 94, 134, and 178 seconds. Slow responses may
reduce the number of checks. Each request also has a ten-second deadline.

The page says **Checking** only during a request, **Waiting** only when another
check is scheduled, and **Automatic checks stopped** when the budget is spent.
Offline cancels pending work and displays a paused state. Reconnect or visibility
return issues one resynchronization: it consumes remaining automatic budget or,
after checking has stopped, makes one request without starting another loop.
Simultaneous browser events are coalesced for one second; requests never overlap.
Manual retry restarts the polling budget but never renews recovery storage.

Unmount, session transitions, expiry, and request timeouts abort work. Each
response is checked against the request sequence and authentication generation
before changing state. Account-keyed rendering also prevents showing the previous
account's balance while a new account renders.

## Backend outcomes and balance

The Billing service validates response structure and checkout-reference equality.
Known payment states are rendered with explicit copy; unrecognized or malformed
responses stop checks and offer retry/support without rendering raw backend data.
Failure and refund states take precedence over historical credit fields.

Successful payment without `credited: true` remains awaiting credit. Only a
recognized credited outcome requests the current account's backend balance.
The returned account ID and numeric balance fields are validated before display.
A failed balance read preserves the credit confirmation and offers **Refresh
balance**, which does not repeat checkout requests or purchase anything.

Live contract discovery: start with `/api/v1/api-summary`, then fetch the live
`billing` group at `/v3/api-docs/billing`. This document describes frontend
behavior, not a local API specification.

## Regression coverage

- `checkoutRecovery.test.ts`: original expiry, account mismatch, malformed or
  unavailable storage, one-time transfer, and cleanup isolation.
- `BillingSuccessPage.test.tsx`: fake-time delayed confirmation, count/time
  exhaustion, retry, offline/resync, reload, terminal outcomes, ownership errors,
  session changes, stale responses, and backend balance failures.
- `billing.service.test.ts`: malformed/mismatched responses and cancellation.
- `tests/privacy/analytics-privacy.test.mjs`: production-bundle desktop/mobile
  reload and credited flows, backend-only balance, no purchase/provider calls,
  clean URLs, analytics/referrer canaries, and responsive overflow checks.

Run focused tests with `npm test -- src/features/billing src/features/privacy`.
After `npm run build`, run `npm run test:privacy:production`. All automated
checkout responses are mocked; these tests do not contact Stripe or live billing.
