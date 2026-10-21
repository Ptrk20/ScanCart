# ScanCart

A mobile-first grocery price checker built with Next.js App Router, React,
strict TypeScript, and Tailwind CSS. No backend or authentication.

## Run locally

Use Node.js 22.18+ (or a current LTS release) and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build, run `npm run build`
followed by `npm start`.

```sh
npm run lint
npm run typecheck
npm test
```

## Implemented scope

This increment covers setup, Home, shopping sessions, basket state, manual
product entry, centralized calculations, IndexedDB persistence, barcode/QR
scanning, completed shopping history, product price comparisons, and PWA support
(Phases 1-11):

- Responsive app shell, mobile bottom navigation, and desktop header navigation.
- Home dashboard with current-store, budget, basket total, remaining-budget,
  scan entry point, and five most recently saved products (including manual entries).
- Working routes for Home, Scan, Basket, History, trip details, and Start Shopping.
- Validated store and optional budget form, shared persisted session Context,
  active Home dashboard, and accessible End Shopping confirmation.
- Shared domain types and tested integer-centavo calculation/formatting utilities.
- Dedicated `/products/new` entry from Home and Basket with optional barcode,
  required name, optional brand/category, current PHP price, quantity, and the
  active session's read-only store.
- Basket page with large quantity controls,
  price editing, removal, row subtotals, physical item count, and product-row count.
- Home and Basket share live totals, remaining budget, and explicit over-budget warnings.
- Derived physical-item and product-row counts, average price per physical item,
  budget status, actual usage percentage, and accessible clamped progress indicators.
- Accessible navigation, focus indicators, skip link, and safe-area spacing.
- Local product, active-session, basket, and append-only price-record persistence.
- User-initiated ZXing camera scanning, manual code lookup, known-product price
  confirmation, and prefilled new-product entry.
- Immutable completed-trip receipts, newest-first history, read-only item details,
  original budget comparisons, and individually confirmed deletion.
- Product Price History with recorded-price summaries, latest-by-store comparisons,
  and same-store price-change context before a known product is confirmed.
- Installable app metadata, branded icons, production-only service worker,
  offline page preparation, and user-approved app updates.

There are no seeded products or price-history charts. Active sessions and baskets survive refreshes
and browser restarts while local browser data remains available. Confirming End
Shopping atomically saves a receipt for a non-empty trip and clears the active
session and basket, retaining products and price records for future trips. Empty
trips end without a receipt. Cancel or Escape preserves all saved records.
Products remain separate from basket snapshots.
The application currently uses system fonts without external font requests.

## Structure

```text
src/
  app/                    Routes, root layout, metadata, global styles
    scan/
    basket/
    history/              Trip list and [id] details route
    shopping/new/
    products/new/         Manual-product route
    products/[id]/prices/ Product price summary, store comparison and full history
  components/
    layout/               App shell and active-route navigation
    home/                 Dashboard sections
    basket/               Rows, quantity controls, dashboard
    product/              Full manual-product form
    scanner/              Camera UI, lookup orchestration, known-product confirmation
    shopping/             Session form and end-session confirmation
    history/              Receipt cards, list, details and confirmed deletion
    price/                Recorded-price summaries, changes, comparisons and states
    pwa/                  Install, connectivity, offline-readiness and update controls
    ui/                   Shared icons and feature-placeholder presentation
  context/                Shopping session provider and consumer hook
  hooks/                  Shopping/price-history loading and retry lifecycles
  types/models.ts         Products, immutable price records, basket snapshots,
                          active/completed shopping sessions, budget summaries
  lib/
    utils/money.ts        PHP formatting and safe money operations
    utils/date.ts         Locale-aware dates in the browser's local timezone
    shopping/budget.ts    Pure shopping-budget business logic
    shopping/session.ts   Session validation and construction
    shopping/basket.ts    Basket validation, immutable transitions, session reducer
    shopping/product.ts   Product input validation, normalization, construction
    shopping/history.ts   Pure completed-trip snapshot creation
    shopping/price-analytics.ts Pure recorded-price and store-comparison analytics
    scanner/              Code inspection, camera lifecycle, browser-only ZXing adapter
    pwa/service-worker.js Production worker source; no IndexedDB access
    db/database.ts        Typed idb connection, schema, indexes, transactions, reset
    db/products.ts        Product CRUD and indexed barcode lookup
    db/basket.ts          Basket source-record operations
    db/sessions.ts        Active-session source-record operations
    db/price-history.ts   Append-only records and product-price lookups
    db/shopping-history.ts Immutable completed-trip repository
    db/shopping.ts        Atomic shopping commands and validated hydration
    db/validation.ts      Runtime checks for persisted source data
tests/                    Node built-in test runner
scripts/build-pwa.mjs      Generates public/sw.js after the Next.js build
public/icons/             Branded normal, maskable and Apple PNG icons
public/offline.html       Self-contained offline fallback
```

The existing session Context exposes
`items`, saved `products`, derived `summary` (budget, total, productCount, itemCount, remaining,
overBudgetBy, averagePricePerItem, usagePercentage, progressPercentage, status), `addItem`,
`removeItem`, `increaseQuantity`, `decreaseQuantity`, `updateQuantity`,
`updatePrice`, `clearBasket`, and `addProduct`, plus `isLoading`, `isSaving`,
and `storageError`. Mutations now return promises; callers await actual database
commit before navigating or showing success. Transitions still use the existing
pure reducer. Invalid transitions retain the prior basket and expose
`basketError`, displayed as an accessible alert on the Basket page.
Keep browser-only storage and camera APIs out of server-rendered modules.

## Data conventions

- Every monetary field (`price`, `lastPrice`, `budget`, `total`) uses integer
  **centavos**: `9500` means PHP 95.00. Convert validated peso form input at
  the UI boundary; never store floating-point pesos.
- Session budgets may be `null` (no spending limit). An explicit zero is a real
  zero budget, not an absent budget. The budget form accepts plain decimal peso amounts
  with up to two decimal places, without grouping separators or exponents.
- Quantities are positive safe integers. Price and budget can be zero.
  Negative remaining budgets are valid and indicate overspending.
- Dates are ISO 8601 strings. IDs are strings; generate them when records
  are created, not during rendering.
- Basket items snapshot product information and the current store price.
  Completed sessions preserve those snapshots.
- Phase 5 replaces the temporary Phase 4 form. Manual products receive a product
  ID distinct from the basket-entry ID. Barcode stays an optional trimmed string,
  preserving leading zeros. Brand/category are trimmed; blank values are allowed.
  Category suggestions include Other and permit arbitrary custom category text.
- **Intentional Phase 5 policy change:** matching barcodes merge even when prices
  differ. The new price applies to the entire row and the entered quantity is
  added. The existing product ID and creation timestamp are retained; descriptive
  details, last price, and update timestamp use the new entry. If no barcodes are
  present, a reliable product ID can match; names alone never match.
- Form validation gives field-specific errors that update as invalid fields are
  corrected. Price is required and nonnegative. **Phase 6 price normalization:**
  extra decimal places round half-up to integer centavos on both product entry
  and basket price edits (10.555 -> PHP 10.56, 95.555 -> PHP 95.56).
  Decimal text is rounded before binary arithmetic, so 1.005 -> PHP 1.01.
  Budget input retains its existing two-decimal validation.
  Quantity is a positive safe integer. Overflow leaves products and basket
  unchanged and displays an error. Rapid submissions are guarded synchronously.
- Successful direct manual submission clears the form and navigates to Basket
  with an accessible success message. Scanner entry instead shows scan-another
  options. Direct Cancel returns to Basket; scanner Cancel resets the scan flow,
  without changing saved data.
  Cached-route cleanup resets form state for repeat entry.
- Price records are appended on product-add and confirmed basket-price actions;
  no history charts or browsing UI is implemented yet.
- Barcode/QR payloads identify products, not store prices. Always support
  entering today's price.

## Calculation rules (Phase 6)

- `money.ts` provides `toCentavos` / `fromCentavos` for explicit peso boundaries,
  exact decimal form parsing, safe-centavo validation, subtotals, and shared PHP
  formatting. Existing domain money is already in centavos: never convert it twice.
  Round unit price before multiplying quantity. Display formatting preserves even
  the final centavo at the safe-integer limit.
- `shopping/budget.ts` provides item subtotals, product-row count, physical-item
  count, basket total, remaining budget, over-budget amount, usage percentage,
  average price per physical item, budget status, and the complete `calculateBudget`
  summary. Helpers are pure and reject invalid or unsafe inputs explicitly.
- The existing shopping-session Context (also owning the basket) memoizes one
  summary from session budget and items. No totals are stored as mutable state.
  Home and Basket pass that same summary to `BudgetOverview`; rows use the shared
  subtotal helper. All basket transitions validate using the same calculator.
- Average price is total / physical-item count, rounded half-up to a centavo;
  an empty basket has zero average, zero total, and zero counts. Free products
  remain included in both counts.
- Status is `no-budget` for `null`, `within-budget` below 80%, `near-budget`
  from 80% through exactly 100%, and `over-budget` only above the budget.
  Thresholds use integer centavos, not rounded percentage text. For zero budget,
  an empty/free basket is within budget and any positive total is over budget.
- No budget means `remaining: null` and no progress indicator. Zero budget uses
  a safe usage value of zero with explanatory text instead of a percentage/bar.
  Otherwise actual usage may exceed 100%; only progress width and ARIA values
  clamp to 0–100. Status text accompanies color; remaining money can be negative.
- Invalid transitions preserve the existing basket and expose an alert. Invalid
  persisted data hides misleading totals, logs the load error, and provides retry
  without automatically erasing user records.

## Local persistence (Phase 7)

- Runtime dependency: `idb`. Tests use the small `fake-indexeddb` implementation
  with the existing Node test runner; no new test framework or localStorage store.
- Database: **`scancart-db`**, schema **version 2**. Original stores: `products`,
  `basket`, `sessions`, `priceHistory`. The version 1 -> 2 upgrade only adds
  `shoppingHistory`; it never deletes/recreates existing stores or data.
- Products and basket rows use string `id` keys. Sessions use a singleton `active`
  key and store only session metadata; items live in `basket`, not in two places.
  Basket records also retain storage-only row-position metadata so UUID ordering
  cannot rearrange the basket on reload. Active shopping stores persist no derived
  subtotal, total, count, budget status, remaining amount, or usage. Completed
  receipts separately preserve final totals and counts.
- Indexes: unique `products.barcode`; compound `priceHistory.productTime`
  (`productId`, `recordedAt`); compound `priceHistory.sessionProduct`
  (`sessionId`, `productId`). Missing barcodes are `undefined` and are not indexed.
  Barcode normalization trims whitespace only; leading zeros and QR text survive.
  `findProductByBarcode` / `getProductByBarcode` support the shared scanner lookup.
- Product repository exposes create, ID/barcode lookup, list, update and delete.
  Basket repository exposes list/save/update/delete/clear. Session repository
  exposes get/save/clear (clearing also removes its basket). Price repository
  exposes append, product history and latest-price lookup. Deleting a product
  currently referenced by the basket is rejected; historical records are retained.
- **Consistency:** UI shopping commands are serialized. Each command reads the
  latest persisted snapshot in one read-write transaction across the five stores,
  runs the existing reducer, and atomically saves its source changes. React publishes
  only after transaction completion. A failed write rolls back all related data,
  displays an alert, logs useful details, and never reports success.
- Manual entry looks up the normalized barcode through the unique index inside
  the transaction. Existing ID/creation timestamp survive; submitted name, brand,
  category, last price and update timestamp replace the product fields. Quantities
  merge and the new price applies to the active basket row. Products without
  barcodes receive independent UUIDs, even when names match.
- Product additions and confirmed price edits append records containing product,
  session, store, integer-centavo price and ISO timestamp. An unchanged latest
  price within the same session is not appended again; changed prices (including
  a return to an older price) and new trips create records. Quantity changes,
  renders, route changes and hydration never add price records. Basket price
  edits also update the saved product's `lastPrice` / `updatedAt`.
- Initial render shows a loading status. The route tree stays rendered but hidden
  and inert until validated hydration completes, avoiding false empty states,
  hydration mismatches and dropped Next.js route segments. Browser APIs run only
  from client effects/actions, never at module load or during server rendering.
- Open/blocked/transaction failures have bounded waits and exit loading into an
  explicit retry state. Recovery never silently substitutes an empty database.
  Unsupported/denied/quota-limited storage must be made available to save changes;
  there is intentionally no misleading in-memory fallback.
- Other tabs' writes are read before each command; concurrent increments are
  preserved. A stale tab cannot modify or resurrect a different/ended session.
  There is no live cross-tab UI broadcast: reload a stale tab to refresh its view.
- `clearScanCartData()` is an internal developer utility clearing only the five
  ScanCart stores in one transaction. It is not exposed as a production button.
  Call it only with explicit intent to erase saved shopping data.
- Persistence is local to this browser profile and origin (including port).
  Clearing site data, private browsing policies, quota/eviction, or profile changes
  can remove records. No cloud backup, export, sync, or offline app shell exists.

## Barcode and QR scanning (Phase 8)

- `/scan` requires an active shopping session. Opening Home or Scan never starts
  a camera automatically. Press **Start Camera** to request permission. Keep
  **Enter Code Manually** and **Add Item Manually** available as fallbacks.
- Uses `@zxing/browser` and its `@zxing/library` peer, loaded only on intentional
  camera activation. Supported formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128,
  Code 39, ITF and QR. The rear camera is preferred; **Switch Camera** appears
  only when multiple video inputs are discovered. Torch is not implemented.
- Requests an ideal 1920 x 1080 video feed, allowing lower resolutions on cameras
  that do not support it. ZXing's `TRY_HARDER` mode searches more of the image and
  retries rotated barcodes instead of requiring horizontal codes at the center.
  Keep the entire code and its white margins visible; move until the bars are
  sharp. A blurred or out-of-focus feed can still prevent decoding.
- The frame is a visual guide, not a cropped decoding region. Keep a clear code
  steady in good light. Video is decoded locally; frames are never uploaded or
  persisted. Camera APIs require HTTPS (localhost is allowed for development).
  A phone visiting an ordinary HTTP LAN address will need manual entry or HTTPS.
- First detection stops decoding and every owned media track before looking up
  the trimmed string barcode in IndexedDB. Leading zeros survive. Duplicate
  callbacks, late permission grants and stale lookup results are ignored safely.
  Explicit Stop, route changes, hidden tabs, page exit, errors and timeouts release
  camera resources. A pending permission prompt may remain under browser control;
  a late-granted stream is immediately stopped. Startup times out after 20 seconds.
- UPC-A and a zero-prefixed EAN-13 have identical bars; ZXing may report the
  12-digit UPC-A form. Scanner/manual-code lookup prefers an exact saved match,
  then tries the checksum-valid equivalent representation. An existing product's
  barcode and ID stay unchanged. Unknown codes retain the decoder's text. This
  does not merge two already-saved products or change direct ProductForm matching;
  QR text and other identifiers are never numerically converted.
- Known products display saved details and last recorded price; the shopper must
  confirm an editable current price and positive quantity. Unknown codes prefill
  the existing ProductForm inline. Both paths await the existing atomic Context
  command: one product ID, merged quantities, confirmed price across the basket
  row, and append-only/deduplicated price records. Detection, lookup and Cancel
  never write prices or add products.
- URLs and arbitrary QR text are shown as plain text for explicit review, never
  opened, fetched or executed. Reviewed text can be used as a product code.
  Scanner codes longer than 512 characters or containing unsupported control
  characters cannot be used; a bounded preview and manual fallback are shown.
  Payloads are not placed in route URLs or interpreted as a price.
- After success, choose **Scan Another Item** or **View Basket**. Camera activation
  remains explicit on every retry. Reload discards transient scan/confirmation
  state, not saved products or basket. Errors have actionable retry/manual paths.
- Tests cover code inspection, real QR-pixel decoding, injected camera lifecycle
  (deduplication, cancellation, late grants, switching and failures), and persistence
  integration. Physical iPhone/Android camera quality and permission behavior still
  need real-device testing; automated browser camera fixtures do not replace it.

## Completed shopping history (Phase 9)

- End Shopping confirms the action before saving. Non-empty trips produce one
  `CompletedShoppingSession`, keyed by the original session UUID. Empty trips end
  without a receipt; free items are not empty and are included in item counts.
  Successful completion opens History with "Shopping trip saved." feedback (or an
  explicit empty-session message).
- **Atomic checkout:** the existing queued Context command reads the latest
  persisted session/basket, validates and computes a snapshot, inserts it using
  `add`, then clears basket and active session in the same read-write transaction.
  React publishes the cleared state only after transaction completion. A quota,
  write, or cleanup failure rolls everything back, keeps the trip available and
  offers Try Again. Products and price records are untouched by completion.
- Duplicate prevention combines a synchronous dialog lock, disabled controls,
  serialized Context writes, expected-session guards against stale tabs, and a
  unique receipt ID with insert-only repository writes. Existing receipts are
  never overwritten. A stale completion cannot end a different active trip.
- `shoppingHistory` schema: keyPath `id`, no additional indexes. Fields:
  `id`, `status: "completed"`, `store`, `budget` (centavos or null), `total`
  (centavos), `productCount`, `itemCount`, `startedAt`, `completedAt`, `items`.
  Items copy basket IDs, optional product IDs/barcodes, names, brands, categories,
  unit prices, quantities and store. Storage-only row positions are omitted.
  Dates are ISO timestamps; completedAt must not precede startedAt.
- `createShoppingHistorySnapshot` is pure and clones item values, using Phase 6
  calculations for totals/counts. Historical subtotals, remaining budget and
  over-budget amounts are derived only from those snapshots, never live products.
  Exact budget shows zero remaining; null means no limit and zero stays a real
  budget. Later product edits/deletion cannot alter historical receipts.
- Repository: `saveShoppingHistory` (insert only), `getShoppingHistory`,
  `getShoppingHistoryById`, `deleteShoppingHistory`, `clearShoppingHistory`
  (internal only). `insertShoppingHistory` also supports the atomic checkout
  transaction. Reads validate timestamps, item snapshots and matching totals.
  Invalid records produce a visible retryable error, not a crash, silent omission
  or automatic deletion.
- `/history` lists newest completedAt first, with a deterministic ID tie-break.
  Cards show store, local date, total, budget and product/physical-item counts.
  `/history/[id]` shows the entire read-only receipt with local completion/start
  times, original budget, spent/remaining/over-budget totals and every item.
  Navigation highlights History on both routes. Next.js Suspense boundaries keep
  dynamic params and pathname-aware navigation compatible with Cache Components.
- The history hook distinguishes loading, empty, ready, missing-ID and error
  states, discards stale asynchronous results, and reloads on cached-route
  re-entry. There is no live cross-tab history feed; reopen the route or refresh.
  Completion feedback is transient and does not survive a full reload.
- Delete History requires a native accessible confirmation dialog with Cancel
  focused first. Delete is disabled while saving; failures keep the receipt and
  offer retry. Success returns to History. Only that receipt is removed, never
  products, prices, other trips, or an active basket. No bulk-delete UI is exposed.
- Tests cover populated v1 migration, immutable snapshots, exact centavo math,
  budgets/counts, empty/free trips, rollback (including failures after receipt
  insertion), concurrent completion, deletion isolation and invalid records.
- All data remains browser/origin-local. Past Phase 8 trips that were ended
  before this upgrade cannot be reconstructed. There is no export/cloud backup,
  editing completed receipts, or shopping-history search/analytics.

## Product price history and store comparison (Phase 10)

- `/products/[id]/prices` uses the saved product ID, not a name or barcode.
  Entry points are available on known scanner results, basket rows with a product
  ID, and Home's five recent products (including manual/no-barcode entries).
  Product identity and barcode handling, including UPC-A/EAN-13 equivalence,
  remain unchanged.
- The read-only page shows name, optional brand/barcode, recorded-price count,
  latest/lowest/highest/average recorded prices, latest-vs-previous price change,
  latest recorded prices by store, and every record newest-first. Dates reuse
  the local-timezone helpers; currency uses the centralized PHP formatter.
  These are personally recorded prices, never live/official supermarket prices.
- `price-analytics.ts` provides `getLatestPrice`, `getPreviousPrice`,
  `getLowestPrice`, `getHighestPrice`, `getAveragePrice`,
  `sortPriceHistoryNewestFirst`, `getPriceHistoryForStore`,
  `groupPriceHistoryByStore`, `getLatestPricesByStore`, `getComparisonPrice`,
  `calculatePriceDifference`, `calculatePriceChangePercentage`, `getPriceTrend`,
  and `calculateProductPriceAnalytics`. Analytics are derived, not persisted.
- Latest and previous mean first and second by explicit `recordedAt` timestamp,
  not insertion order. Equal timestamps use ascending record ID as a stable
  tie-break. Equal lowest/highest values prefer the newest matching record.
  Helpers do not mutate source arrays or records. Repository
  `getLatestPriceForProduct` reuses this ordering.
- Average counts each persisted confirmation once, not each purchased unit.
  It uses exact BigInt accumulation and half-up rounding to integer centavos,
  including when a combined sum exceeds JavaScript's safe-integer range.
  Differences use signed integer centavos; percentages are
  `(current - previous) / previous * 100`, displayed to at most two decimals.
  A zero previous price yields an unavailable percentage, never NaN/Infinity.
  Increase/decrease/no-change wording does not rely on color.
- Store comparisons take only the latest record for each exact entered store
  name, then sort by price ascending (store name breaks price ties). Older cheap
  prices cannot displace newer prices at that store. Tied lowest latest values
  are labeled as ties, and the highest-to-lowest latest difference is shown.
  Branches, capitalization and stored names are never merged or fuzzy-matched.
- Known scanner results retrieve prior history before confirmation. The entered
  shelf price is compared with the latest price at the active session's exact
  store. If none exists there, comparison falls back to the overall latest and
  explicitly says it is from another store. Invalid input shows no computed
  comparison. The initial price remains an editable suggestion; the user must
  still confirm it. A missing/unavailable history is not a fabricated zero and
  does not silently prevent manual confirmation.
- Existing atomic shopping writes remain the only production record-creation
  path: manual entries, known-product confirmation, and basket price edits all
  use `recordConfirmedPrice`. Rendering, scanning lookup, editing input, viewing,
  and refreshing price history create no records. Existing locks, transaction
  serialization, session checks and unchanged-price deduplication are preserved.
  The comparison baseline is loaded before the new confirmation, not queried
  afterward and compared to itself.
- Loading, retryable error, empty, single-price, genuine-zero and missing-product
  states are explicit. Invalid persisted dates/prices reject the load with a
  logged error and friendly retry action; no records are silently skipped,
  erased or repaired. The hook cancels stale results and reloads on cached-route
  re-entry. No per-render database queries or live cross-tab subscriptions.
- **No database change:** version **2 -> 2**. The existing composite
  `priceHistory.productTime` index already supports product lookup. The five
  stores, receipt schema and v1 -> v2 migration remain unchanged. No dependency
  or charting library was added. No price-record deletion UI is exposed.
- Existing product deletion retains orphaned price records; the price page
  displays Product not found if its product no longer exists. Neither analytics
  nor future product-price confirmations modify completed shopping snapshots.
- Automated tests cover empty/single/free/unsorted/tied histories, average
  overflow/rounding, centavo changes, zero denominators, latest per store,
  exact store names, same-store/fallback baselines, corruption, read-only views,
  shared confirmation deduplication and receipt/product-deletion independence.
- Limitations: local browser/origin data only; no external pricing, predictions,
  chart, export, search, branch normalization or automatic cross-tab refresh.
  A comparison uses the history loaded for that view; reopen it to pick up
  another tab's changes. Phase 10 itself did not change the database schema.

## Progressive Web App (Phase 11)

ScanCart uses Next.js App Router's native `src/app/manifest.ts` and one small
service worker, without another dependency or framework integration plugin.
This fits the installed Next.js 16 App Router and keeps RSC responses out of
the HTML cache.

### Build, run and install

- Development: `npm run dev`. The worker does **not** register in development.
- Production: `npm run build`, then `npm start`. The build runs Next.js first,
  then generates `public/sw.js` with the Next build ID as its cache version.
  Deploy that generated file together with the build and public assets;
  running bare `next build` skips worker generation.
  Generation reads the build ID and worker source only; it does not depend on
  `.next/server/app/index.html` or other prerendered HTML files, whose presence
  can differ between local and hosted builds. During installation, the worker
  fetches the deployed core pages and caches the scripts/styles they reference.
- Vercel uses the checked-in `vercel.json` build command, `npm run build`, so
  worker generation also runs in deployments. After deploying, `/sw.js` must
  return HTTP 200 with JavaScript, not a 404 or an HTML error page.
  If it returns 404, check the deployment build log for the `ScanCart PWA`
  generation message and confirm the full build command ran.
  Reopen the installed app online and wait for "This page is saved for offline
  use" before testing without a connection. Do not clear site data or uninstall
  as a troubleshooting step: local shopping records may be lost.
- The optional VS Code **PWA production preview** task serves the production
  build at `http://127.0.0.1:54230`.
- Deploy at the origin root over HTTPS. Camera access and service workers
  require a secure context; loopback addresses are permitted for local testing.
- The manifest uses ScanCart's name, root scope/start URL, standalone display,
  forest theme, 192/512px icons and a separate safe-zone maskable icon.
  Apple metadata uses a 180px touch icon. Existing SVG branding is retained;
  the ICO favicon also uses ScanCart artwork rather than the framework default.
- Home shows Install only after the browser provides an install prompt.
  Not Now dismisses the offer for the current app lifetime, without writing
  preferences or shopping data. Safari on iOS gets Share / Add to Home Screen
  guidance instead. Installed standalone mode hides the offer. Unsupported
  browsers can continue using the ordinary website.

### Caching and offline behavior

- Installation precaches Home, Scan, Basket, History, manual product entry,
  Start Shopping, their initial JavaScript/CSS, icons, manifest and fallback.
- Documents are network-first with a five-second timeout, then fall back to
  the exact cached document or `public/offline.html`. Static build assets use
  cache-first; requests for APIs, mutations, external URLs and App Router
  RSC/prefetch data are not cached.
- Visiting a trip or product-price detail page online prepares its HTML and
  referenced build assets. The app reports when preparation succeeds or fails,
  with retry. Unvisited detail pages can show the offline fallback, including
  newly created offline receipts until their pages are prepared online.
- Offline App Router links may first log a failed RSC request before Next.js
  falls back to full-document navigation. These expected network messages do
  not mean the cached page or IndexedDB failed.
- Cached pages can read and update local products, basket, sessions and
  histories. Initial installation needs a connection. Activate the scanner
  online once to cache its lazy ZXing resources before relying on it offline.
  Camera activation stays explicit, permissions still apply, and manual entry
  remains available. Nothing uploads camera video.
- The offline banner reflects the browser's connectivity signal, not a
  guarantee that the server is reachable. If a refresh cannot reach the
  server but a saved page exists, the app explains that it is using that copy.

### Updates and data safety

- New workers wait; there is no automatic reload during shopping. Reload to
  Update activates the waiting worker and reloads only the requesting tab.
  Other tabs get an update notice rather than a forced reload.
- The notice warns about unsaved form edits and active scans. The button is
  disabled during shopping hydration/writes, while updating, and offline.
  Setup/update failures display friendly messages and retry; normal use is
  not blocked.
- Activation deletes only old `scancart-shell-` Cache Storage entries.
  **IndexedDB remains `scancart-db` version 2, with all five stores unchanged.**
  Installation, cache cleanup and updates never reset shopping records.
  Cached HTML contains the app shell, not copies of user shopping records.
- Browser storage eviction, clearing site data, or platform-specific uninstall
  behavior can still remove local data. Installation is not a backup or cloud
  synchronization. Different origins/ports have separate local databases.

### Verification and limits

- `npm test` includes worker-policy, cache/fallback, update-activation,
  manifest and PNG-dimension tests alongside existing shopping/scanner tests.
  Run `npm run lint`, `npm run typecheck` and `npm run build` as well.
- Production checks in embedded Chromium returned no CDP installability errors.
  A fresh worker installation showed no false update notice.
- With the isolated production server actually stopped, cached reloads,
  basket edits, manual entry, trip completion, history/price reads, unknown-page fallback and
  decoding a synthetic barcode with warmed ZXing resources worked.
- A real waiting-worker update preserved the complete contents of all five
  IndexedDB stores byte-for-byte, including active basket and immutable receipt.
- Install-prompt and Not Now controls were exercised with a simulated browser
  event, not a native installation. An injected worker-registration failure
  showed its error while the ordinary website remained usable, then recovered.
  Basket layout had no horizontal overflow at 360, 390, 430, 768 and 1280px.
- Camera decoding regression checks used a controlled video stream, not a new
  physical-device camera certification.
- Physical Android installation, physical iPhone installation, and installed
  standalone launch/safe-area behavior remain **pending**. Desktop browser
  installability is not proof of those device behaviors. No Lighthouse audit
  has been run. Offline availability depends on successful caching and the
  browser retaining both cache and local database storage.

Camera access will require HTTPS on deployed devices (localhost is allowed
for development). Data is local to the browser/device and may be
cleared by the browser; no cloud synchronization is planned for this version..
