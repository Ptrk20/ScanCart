Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 9 are already implemented.

Do not recreate the project.
Do not rename ScanCart.
Do not replace working functionality.
Do not start Phase 11.

Before writing code:

1. Inspect the existing project structure.
2. Review Product and PriceHistoryRecord types.
3. Review the IndexedDB schema and current DB_VERSION.
4. Review products.ts and priceHistory.ts repositories.
5. Review ShoppingHistory data from Phase 9.
6. Review the Phase 8 scanner known-product workflow.
7. Review ProductForm.
8. Review calculations.ts, currency.ts, and date formatting utilities.
9. Review current product lookup and barcode handling.
10. Preserve all functionality from Phases 1 through 9.

==================================================
PROJECT
==================================================

Project:

ScanCart

TECH STACK:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router
- IndexedDB
- Existing IndexedDB wrapper
- ZXing scanner integration

CURRENT FUNCTIONALITY:

- Mobile-first interface
- Shopping sessions
- Store selection
- Budget management
- Basket
- Manual product entry
- Barcode / QR scanning
- Known-product lookup
- Product persistence
- Basket persistence
- Shopping-session persistence
- Price-record persistence
- Shopping history
- Historical shopping snapshots
- Centralized calculations

==================================================
PHASE 10 GOAL
==================================================

Implement Product Price History and basic Store Price Comparison.

ScanCart should help users answer:

1. What prices have I previously recorded for this product?
2. Which stores did I record those prices at?
3. What was the most recent recorded price?
4. What was the lowest recorded price?
5. What was the highest recorded price?
6. How does today's entered price compare with the previous price?
7. Which store has the lowest latest recorded price for this product?

Use only the user's locally recorded ScanCart data.

Do NOT imply prices are current supermarket prices unless the user
recorded them.

Do NOT introduce external pricing APIs in this phase.

==================================================
1. CORE PRINCIPLE
==================================================

Price History represents prices personally recorded through ScanCart.

It is NOT:

- Live supermarket inventory
- Official store pricing
- Real-time pricing
- Online product pricing

Display language should make this distinction clear.

Prefer labels such as:

"Recorded Price"

"Last Recorded"

"Lowest Recorded"

"Price History"

"Latest Recorded by Store"

Avoid labels such as:

"Current Market Price"

"Official Price"

"Live Price"

unless ScanCart actually receives that data from a trusted external
source in a future phase.

==================================================
2. PRICE HISTORY TYPE
==================================================

Review the existing Phase 7 type.

It may resemble:

interface PriceHistoryRecord {
  id: string;
  productId: string;
  store: string;
  price: number;
  recordedAt: string;
}

Preserve this structure unless the existing implementation requires
additional fields.

Optional useful fields may include:

barcode?: string
shoppingSessionId?: string

Do not add fields without a clear use.

Do not duplicate Product information such as full name and brand in
PriceHistoryRecord unless required by the existing architecture.

==================================================
3. PRICE HISTORY REPOSITORY
==================================================

Review:

src/lib/db/priceHistory.ts

Expand it as needed.

Useful repository operations may include:

addPriceRecord()

getPriceHistoryForProduct(productId)

getLatestPriceForProduct(productId)

getLatestPriceByStore(productId)

getLowestRecordedPrice(productId)

getHighestRecordedPrice(productId)

deletePriceHistoryForProduct(productId)

Do not force all analytics into IndexedDB repository queries if the
dataset is small.

A better architecture may be:

Repository
    ↓
Raw Price Records
    ↓
Pure Analytics Utilities
    ↓
UI

Keep repository concerns separate from analytics.

==================================================
4. PRICE ANALYTICS UTILITIES
==================================================

Create:

src/lib/priceAnalytics.ts

or use an equivalent existing utility location.

Implement pure functions for price analysis.

Possible functions:

getLatestPrice(records)

getPreviousPrice(records)

getLowestPrice(records)

getHighestPrice(records)

getAveragePrice(records)

getLatestPricesByStore(records)

calculatePriceDifference(currentPrice, previousPrice)

calculatePriceChangePercentage(currentPrice, previousPrice)

sortPriceHistoryNewestFirst(records)

groupPriceHistoryByStore(records)

These functions must:

- Not mutate input arrays
- Handle empty arrays
- Avoid NaN
- Avoid Infinity
- Use ScanCart's centavo-safe monetary strategy where appropriate
- Use strict TypeScript

==================================================
5. LATEST RECORDED PRICE
==================================================

Determine the latest record using:

recordedAt

not array insertion order.

Example:

₱95
October 1

₱99
October 8

₱97
October 15

Latest:

₱97

Use explicit timestamp ordering.

If zero records exist:

Return undefined/null according to the project's established conventions.

Do not fabricate a price.

==================================================
6. PREVIOUS RECORDED PRICE
==================================================

Determine the record immediately before the latest record.

Example:

October 1
₱95

October 8
₱99

October 15
₱97

Latest:
₱97

Previous:
₱99

This enables price-change comparisons.

If fewer than two records exist:

Do not display a misleading percentage change.

==================================================
7. LOWEST RECORDED PRICE
==================================================

Calculate the lowest price from the product's recorded history.

Example:

₱95
₱99
₱92
₱97

Lowest Recorded:

₱92

If multiple records have the same lowest price, the UI may show the
most recent matching record if a date/store is needed.

Do not claim:

"Cheapest Price Everywhere"

Use:

"Lowest Recorded Price"

==================================================
8. HIGHEST RECORDED PRICE
==================================================

Calculate:

Highest Recorded Price

Example:

₱95
₱99
₱92
₱97

Highest:

₱99

Use appropriate centavo-safe comparison.

==================================================
9. AVERAGE RECORDED PRICE
==================================================

Calculate the average price when useful.

Example:

₱90
₱100
₱110

Average:

₱100

Use centavo-safe aggregation.

Do not display excessive decimal precision.

Format the result with the centralized PHP currency formatter.

==================================================
10. PRICE DIFFERENCE
==================================================

Implement:

calculatePriceDifference(
  currentPrice,
  previousPrice
)

Formula:

currentPrice - previousPrice

Examples:

Previous:
₱95

Current:
₱99

Difference:

+₱4


Previous:
₱100

Current:
₱95

Difference:

-₱5

Use centavo-safe arithmetic.

==================================================
11. PRICE CHANGE PERCENTAGE
==================================================

Implement:

calculatePriceChangePercentage(
  currentPrice,
  previousPrice
)

Formula:

((currentPrice - previousPrice) / previousPrice) * 100

Example:

Previous:
₱100

Current:
₱110

Result:

+10%

Handle:

previousPrice = 0

safely.

Never return:

NaN
Infinity

If percentage change cannot be meaningfully calculated, return null or
undefined.

==================================================
12. PRICE TREND STATUS
==================================================

Create a simple trend type:

type PriceTrend =
  | "increased"
  | "decreased"
  | "unchanged"
  | "insufficient-data";

Implement:

getPriceTrend(currentPrice, previousPrice)

Examples:

₱95 -> ₱99
increased

₱99 -> ₱95
decreased

₱95 -> ₱95
unchanged

Only one recorded price:
insufficient-data

Do not infer long-term economic trends from two product prices.

==================================================
13. PRODUCT PRICE HISTORY PAGE
==================================================

Create a route such as:

src/app/products/[id]/prices/page.tsx

Example:

/products/product-123/prices

Use product IDs instead of product names.

Page should display:

- Product name
- Brand when available
- Barcode when available
- Latest recorded price
- Lowest recorded price
- Highest recorded price
- Average recorded price
- Price record count
- Individual historical records
- Store comparisons

Example:

--------------------------------

Fresh Milk

Example Brand

Barcode
4801234567890

PRICE SUMMARY

Last Recorded
₱99.00

Lowest Recorded
₱92.00

Highest Recorded
₱105.00

Average Recorded
₱97.50

--------------------------------

PRICE HISTORY

Oct 21
SM Supermarket
₱99.00

Oct 14
Puregold
₱92.00

Oct 07
SM Supermarket
₱95.00

--------------------------------

==================================================
14. PRICE HISTORY COMPONENT
==================================================

Create reusable components only where useful.

Potential structure:

components/price/
├── PriceSummary.tsx
├── PriceHistoryList.tsx
├── PriceHistoryItem.tsx
├── PriceComparisonCard.tsx
└── StorePriceComparison.tsx

Do not create unnecessary tiny components.

==================================================
15. PRICE HISTORY ORDER
==================================================

Display history:

Newest first.

Use:

recordedAt

Do not assume IndexedDB returns records in chronological order.

If timestamps are invalid, handle them gracefully without crashing the
page.

==================================================
16. EMPTY PRICE HISTORY
==================================================

If no price history exists:

Display:

"No price history recorded yet."

Supporting text:

"Prices you record while shopping will appear here."

Do not display:

₱0

as if that were a historical price unless a genuine zero-price record
exists.

Distinguish:

No data

from:

Recorded price = ₱0.00

==================================================
17. SINGLE PRICE RECORD
==================================================

If only one record exists:

Display:

Last Recorded
₱95

Lowest Recorded
₱95

Highest Recorded
₱95

Do not show:

+0%

as a price trend.

Display:

"Not enough history to calculate a price change."

or simply omit trend information.

==================================================
18. STORE PRICE GROUPING
==================================================

Group historical prices by store.

Example records:

SM Supermarket
₱95
Oct 1

SM Supermarket
₱99
Oct 15

Puregold
₱92
Oct 10

Puregold
₱96
Oct 20

For store comparison, use the LATEST recorded price for each store.

Expected:

SM Supermarket
₱99
Oct 15

Puregold
₱96
Oct 20

Do not compare an old price from one store with the latest price from
another if a newer record exists for that store.

==================================================
19. STORE PRICE COMPARISON
==================================================

Create a section:

"Latest Recorded by Store"

Example:

--------------------------------

Latest Recorded by Store

Puregold
₱96.00
Recorded Oct 20

SM Supermarket
₱99.00
Recorded Oct 15

--------------------------------

Sort by price ascending when showing a price-comparison view.

Lowest latest recorded price first.

Do not describe this as guaranteed current pricing.

==================================================
20. BEST RECORDED STORE
==================================================

If multiple stores have price records:

Identify the store with the lowest LATEST recorded price.

Example:

Puregold
Latest: ₱96

SM Supermarket
Latest: ₱99

Display:

Lowest Latest Recorded
Puregold
₱96

Use careful language.

Do NOT say:

"Puregold is always cheaper."

Do NOT say:

"Best supermarket."

The result applies only to the recorded data for this particular product.

==================================================
21. PRICE DIFFERENCE BETWEEN STORES
==================================================

If two or more stores exist, show useful difference information.

Example:

Lowest latest recorded:
Puregold
₱96

Highest latest recorded:
SM Supermarket
₱99

Difference:
₱3

Use centralized monetary calculations.

Do not extrapolate this difference to other products.

==================================================
22. SCANNER INTEGRATION
==================================================

Enhance the Phase 8 known-product flow.

When a known product is scanned, display useful historical context before
the user confirms today's price.

Example:

Fresh Milk

Last Recorded
₱95

Last Store
SM Supermarket

Today's Price
₱ [ 99 ]

Price Change

+₱4
+4.21%

The user should still manually confirm the current store price.

Do not automatically add the stored historical price to the basket
without confirmation.

==================================================
23. CURRENT STORE COMPARISON
==================================================

When scanning at an active store:

Store:
SM Supermarket

Find the most recent previous price for that product AT THAT SAME STORE
when available.

Example:

Last at SM Supermarket:
₱95

Today:
₱99

Difference:
+₱4

Prefer same-store comparison for the initial scanner price-change
message.

This is more meaningful than blindly comparing against a different
store.

If no previous record exists for the current store, optionally fall back
to the overall previous recorded price and clearly label the comparison.

==================================================
24. IMPORTANT: DON'T COMPARE AGAINST THE NEW RECORD
==================================================

When the user enters today's price:

1. Retrieve relevant PREVIOUS records.
2. Calculate comparison.
3. Then save today's new price record.

Do not:

Save today's price
       ↓
Query latest price
       ↓
Compare today's price to itself

That would incorrectly show:

No Change

The comparison must use history that existed prior to the new
confirmation.

==================================================
25. DUPLICATE PRICE RECORD PROTECTION
==================================================

Preserve the Phase 7/8 duplicate protection.

Do not generate price records because:

- Component rendered
- Page refreshed
- Scanner callback repeated
- Price-history page opened

Only create records from explicit user actions such as:

Add to Basket
Confirm Current Price

Prevent rapid repeated submission from creating duplicate records.

==================================================
26. PRICE HISTORY FROM MANUAL ENTRY
==================================================

Products added manually must contribute to price history exactly like
scanned products.

Example:

Manual product:

Fresh Pandesal
Store:
Local Bakery

Price:
₱5

Expected:

A PriceHistoryRecord is created through the existing persistence flow.

Do not maintain separate price-history logic for scanned and manual
products.

==================================================
27. PRODUCT PAGE ENTRY POINT
==================================================

Add a way to view price history for known products.

Possible actions:

[ View Price History ]

This may appear from:

- Scanned product result
- Product details
- Product lookup
- Basket item where appropriate

Avoid cluttering every basket row if the existing mobile UI becomes too
busy.

==================================================
28. PRICE CHANGE DISPLAY
==================================================

Use clear visual treatment.

Example increased:

↑ ₱4.00
+4.21%

Example decreased:

↓ ₱3.00
-3.06%

Example unchanged:

No change

Use text/icons in addition to color.

Do not rely on red/green alone.

Avoid presenting a price decrease as objectively "good" or increase as
objectively "bad."

Keep wording factual.

==================================================
29. PRICE HISTORY CHART
==================================================

Add a simple price-over-time chart only if the current project already
has a charting dependency that fits.

If no charting library exists, do NOT add a large dependency just for a
single chart.

A simple list is sufficient for the Phase 10 core implementation.

If a lightweight chart is appropriate, plot:

X axis:
Recorded date

Y axis:
Price (PHP)

Each point:

PriceHistoryRecord

For multiple stores, distinguish them clearly.

Do not fabricate missing dates or interpolate prices.

==================================================
30. NO FUTURE PRICE PREDICTION
==================================================

Do not implement:

- Price forecasting
- AI prediction
- Future grocery price estimation
- Inflation prediction

Price history should describe recorded historical data only.

==================================================
31. PRICE RECORD COUNT
==================================================

It is acceptable to display:

"5 recorded prices"

only if the count is directly calculated from the retrieved records.

Do not store a separate mutable record-count field.

==================================================
32. STORE NAME NORMALIZATION
==================================================

Use the active ShoppingSession store as the source of new price-record
store values.

Do not silently transform store names in a way that could merge
different stores incorrectly.

Example:

"SM Supermarket - Makati"

should not automatically become:

"SM Supermarket"

unless ScanCart already has explicit store normalization.

For Phase 10, retain entered store names.

==================================================
33. PRICE HISTORY DELETION
==================================================

Do NOT provide casual per-record deletion inside the main history list
unless necessary.

Historical price records support comparison accuracy.

If deletion already exists or is needed, require confirmation.

Deleting a PriceHistoryRecord must NOT:

- Delete the Product
- Delete ShoppingHistory
- Delete BasketItems
- Delete current session

==================================================
34. SHOPPING HISTORY RELATIONSHIP
==================================================

Shopping History and Price History remain separate.

Shopping History:

"What did I buy on October 21?"

Price History:

"What prices have I recorded for Fresh Milk?"

Do not replace either one with the other.

A ShoppingHistory snapshot must remain immutable.

Price-history changes must not modify completed shopping trips.

==================================================
35. PRODUCT DELETION
==================================================

Review existing Product deletion behavior.

If Product deletion exists:

Do not silently delete PriceHistory records unless that behavior is
already explicitly designed.

If historical prices remain after Product deletion, ensure they do not
cause crashes.

Document the chosen relationship.

Do not make unrelated destructive changes in Phase 10.

==================================================
36. ANALYTICS SUMMARY
==================================================

Create a derived analytics structure if useful.

Suggested:

interface ProductPriceAnalytics {
  latest?: PriceHistoryRecord;
  previous?: PriceHistoryRecord;
  lowest?: PriceHistoryRecord;
  highest?: PriceHistoryRecord;
  average?: number;
  latestByStore: PriceHistoryRecord[];
  recordCount: number;
}

Possible function:

calculateProductPriceAnalytics(records)

Keep this derived.

Do not persist ProductPriceAnalytics in IndexedDB.

==================================================
37. STORE-SPECIFIC HISTORY
==================================================

Implement a helper:

getPriceHistoryForStore(records, store)

or equivalent.

Use predictable string comparison consistent with how stores currently
exist in ScanCart.

Do not introduce fuzzy matching in Phase 10.

==================================================
38. DATE FORMATTING
==================================================

Reuse Phase 9 date-formatting utilities.

Display:

October 21, 2026

or compact forms where appropriate:

Oct 21

Do not display raw ISO timestamps.

Preserve ISO timestamps in IndexedDB.

==================================================
39. CURRENCY FORMATTING
==================================================

Reuse:

src/lib/currency.ts

Example:

₱95.00
₱1,250.50

Do not manually concatenate the peso symbol.

Do not scatter toFixed() calls across components.

==================================================
40. MOBILE-FIRST UI
==================================================

Optimize for:

360px - 430px smartphone screens.

The price-history page should emphasize:

1. Product
2. Latest price
3. Price change
4. Store comparison
5. Historical records

Avoid overwhelming the user with analytics.

A good priority order is:

Product
   ↓
Current/Latest Context
   ↓
Price Summary
   ↓
Latest Recorded by Store
   ↓
Full History

==================================================
41. LOADING STATE
==================================================

Handle IndexedDB loading.

Show:

"Loading price history..."

Do not briefly display:

"No price history"

before the database finishes loading.

Use explicit:

loading
success
empty
error

states.

==================================================
42. ERROR STATE
==================================================

If price history cannot be loaded:

Display:

"We couldn't load the price history."

Provide:

[ Try Again ]

Do not expose raw IndexedDB exception messages.

Do not leave the screen permanently loading.

==================================================
43. PRODUCT NOT FOUND
==================================================

If:

/products/[id]/prices

references a missing Product:

Display:

"Product not found."

Provide:

[ Go Back ]

If historical records exist for a deleted/missing Product and the
existing architecture supports displaying them safely, handle that
case gracefully.

Do not crash.

==================================================
44. ACCESSIBILITY
==================================================

Use:

- Semantic headings
- Accessible lists
- Accessible buttons
- Proper labels
- Visible focus states
- Text descriptions for trends
- aria-live where useful for scanner price-comparison feedback
- Accessible chart labels if a chart exists

Do not communicate increase/decrease using color alone.

==================================================
45. PERFORMANCE
==================================================

Do not query the entire IndexedDB database repeatedly during rendering.

Retrieve the required product history once per relevant product change,
then derive analytics using pure functions.

Consider memoization only when beneficial.

Do not prematurely optimize a small local dataset.

==================================================
46. DATABASE INDEX REVIEW
==================================================

Review the existing priceHistory store.

If efficient product lookup requires an index:

productId

consider adding one.

If store-level queries require a useful composite or additional index,
evaluate whether it is actually necessary.

If schema changes are required:

Increment DB_VERSION correctly.

Do not delete existing IndexedDB data.

Do not increment DB_VERSION if no schema change is required.

==================================================
47. DATABASE MIGRATION SAFETY
==================================================

If Phase 10 changes the IndexedDB schema:

Use a non-destructive migration.

Example progression:

Previous:
DB_VERSION = 2

New:
DB_VERSION = 3

Only if needed.

Existing:

products
basket
sessions
priceHistory
shoppingHistory

must remain intact.

Do NOT reset the database during development simply to avoid writing a
migration.

==================================================
48. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- External supermarket pricing APIs
- Global/community pricing
- Price scraping
- Product recommendations
- AI price prediction
- Future price forecasting
- Receipt OCR
- Receipt scanning
- Supabase
- PostgreSQL
- Authentication
- Cloud synchronization
- Shared family accounts
- Push notifications
- PWA installation
- Service workers

These belong to future phases or optional features.

==================================================
49. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing ScanCart project.

Relevant structure may approximately become:

src/
│
├── app/
│   ├── page.tsx
│   ├── scan/
│   ├── basket/
│   ├── history/
│   └── products/
│       ├── new/
│       └── [id]/
│           └── prices/
│               └── page.tsx
│
├── components/
│   ├── price/
│   │   ├── PriceSummary.tsx
│   │   ├── PriceHistoryList.tsx
│   │   ├── PriceHistoryItem.tsx
│   │   ├── PriceComparisonCard.tsx
│   │   └── StorePriceComparison.tsx
│   │
│   ├── scanner/
│   ├── product/
│   ├── basket/
│   ├── history/
│   └── shopping/
│
├── hooks/
│   └── usePriceHistory.ts
│
├── lib/
│   ├── db/
│   │   ├── database.ts
│   │   ├── products.ts
│   │   ├── priceHistory.ts
│   │   └── shoppingHistory.ts
│   │
│   ├── priceAnalytics.ts
│   ├── calculations.ts
│   ├── currency.ts
│   └── date.ts
│
└── types/
    ├── price.ts
    ├── product.ts
    ├── history.ts
    ├── basket.ts
    └── shopping.ts

Do NOT blindly create every listed file.

Reuse existing equivalents.

==================================================
50. REQUIRED TEST SCENARIOS
==================================================

Verify at minimum:

TEST 1: NO PRICE HISTORY

Records:

[]

Expected:

Display:
"No price history recorded yet."

Do not display ₱0.00 as if it were historical data.


TEST 2: SINGLE PRICE

Record:

SM Supermarket
₱95

Expected:

Latest = ₱95
Lowest = ₱95
Highest = ₱95

Trend:
insufficient-data


TEST 3: MULTIPLE PRICES

Records:

₱95
₱99
₱92
₱97

Expected:

Lowest = ₱92
Highest = ₱99

Latest depends explicitly on recordedAt.


TEST 4: TIMESTAMP SORTING

Insert records out of chronological order.

Expected:

Latest is determined by recordedAt, not array order.


TEST 5: PRICE INCREASE

Previous:

₱100

Current:

₱110

Expected:

Difference:
+₱10

Percentage:
+10%

Trend:
increased


TEST 6: PRICE DECREASE

Previous:

₱100

Current:

₱90

Expected:

Difference:
-₱10

Percentage:
-10%

Trend:
decreased


TEST 7: UNCHANGED PRICE

Previous:

₱95

Current:

₱95

Expected:

Difference:
₱0

Trend:
unchanged


TEST 8: ZERO PREVIOUS PRICE

Previous:

₱0

Current:

₱10

Expected:

No NaN
No Infinity
Percentage should be unavailable/null according to implementation.


TEST 9: CENTAVO ACCURACY

Previous:

₱95.10

Current:

₱95.20

Expected:

Difference:

₱0.10

No floating-point artifact appears.


TEST 10: SAME STORE HISTORY

SM records:

Oct 1:
₱95

Oct 15:
₱99

Expected latest SM price:

₱99


TEST 11: MULTIPLE STORES

Records:

SM
Oct 15
₱99

Puregold
Oct 20
₱96

Expected:

Latest Recorded by Store:

Puregold ₱96
SM ₱99

Lowest latest recorded:

Puregold
₱96


TEST 12: OLD CHEAP PRICE VS NEW PRICE

Puregold:

September:
₱85

October:
₱100

SM:

October:
₱95

Expected store comparison uses:

Puregold ₱100
SM ₱95

Do NOT use old Puregold ₱85 as the current/latest comparison.


TEST 13: SCANNER SAME-STORE COMPARISON

Active store:

SM Supermarket

Previous SM price:

₱95

Today's entered price:

₱99

Expected:

+₱4

Correct percentage based on ₱95.


TEST 14: RECORD CREATION ORDER

Existing latest:

₱95

User enters today:

₱99

Expected comparison:

₱99 vs ₱95

NOT:

₱99 vs ₱99


TEST 15: MANUAL PRODUCT PRICE

Add product manually with:

Store:
Puregold

Price:
₱75

Expected:

Price record enters the same history workflow as a scanned product.


TEST 16: SHOPPING HISTORY INDEPENDENCE

Completed shopping history contains:

Milk
₱95

Later price history becomes:

₱110

Expected:

Shopping History still displays ₱95.


TEST 17: PAGE REFRESH

Open product price history.

Refresh.

Expected:

IndexedDB records reload successfully.
Analytics are recalculated correctly.


TEST 18: INVALID PRODUCT ID

Open nonexistent product price route.

Expected:

Product not found.

No crash.


TEST 19: DUPLICATE RENDER

Open/refresh price-history page multiple times.

Expected:

No new PriceHistoryRecord is created merely from viewing history.


TEST 20: DATABASE UPGRADE

If Phase 10 requires a DB schema/index upgrade:

Expected:

Existing:
products
basket
sessions
priceHistory
shoppingHistory

remain intact.

No user records are erased.

==================================================
51. TESTING
==================================================

Use the project's existing testing framework.

Prioritize unit tests for:

getLatestPrice()

getPreviousPrice()

getLowestPrice()

getHighestPrice()

getAveragePrice()

getLatestPricesByStore()

calculatePriceDifference()

calculatePriceChangePercentage()

getPriceTrend()

calculateProductPriceAnalytics()

Test with:

- Empty arrays
- Single records
- Multiple records
- Unsorted timestamps
- Identical prices
- Zero prices
- Decimal values
- Multiple stores

Prefer pure-function tests.

==================================================
52. QUALITY CHECK
==================================================

After implementation, run relevant package.json commands.

Verify:

- TypeScript passes
- ESLint passes
- Existing tests pass
- New tests pass
- Production build succeeds
- Price calculations are centavo-safe
- No NaN values
- No Infinity values
- No duplicate records from rendering
- No mutation of ShoppingHistory
- No mutation of Product history when viewing analytics
- Latest price uses recordedAt
- Latest-by-store logic is correct
- Scanner comparison uses previous data
- Existing IndexedDB data remains intact
- Mobile layout has no horizontal overflow
- Phases 1 through 9 continue working

Fix all Phase 10-related problems before considering the phase complete.

==================================================
53. FINAL RESPONSE
==================================================

After completing Phase 10, report:

1. Files created
2. Files modified
3. Files removed, if any
4. Price analytics utilities created
5. Price-history UI implemented
6. Latest-price logic
7. Previous-price logic
8. Lowest/highest calculations
9. Average-price calculation
10. Price-change calculation
11. Percentage-change calculation
12. Store comparison implementation
13. Same-store scanner comparison
14. IndexedDB changes, if any
15. Old and new DB version, if changed
16. Automated tests completed
17. TypeScript result
18. ESLint result
19. Test result
20. Production-build result
21. Known limitations

Do NOT start Phase 11 automatically.

Stop after Phase 10 is complete.
