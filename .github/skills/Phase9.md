Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 8 are already implemented.

Do not recreate the project.
Do not rename ScanCart.
Do not replace working functionality.
Do not start Phase 10.

Before writing code:

1. Inspect the existing project structure.
2. Review ShoppingSessionContext.
3. Review BasketContext.
4. Review the IndexedDB database schema and DB_VERSION.
5. Review the session, basket, product, and price-history repositories.
6. Review Product, BasketItem, and ShoppingSession types.
7. Review the current End Shopping workflow.
8. Review calculations.ts and currency.ts.
9. Review the existing /history page or placeholder if one exists.
10. Review date/time formatting conventions already used by ScanCart.
11. Preserve all working functionality from Phases 1 through 8.

==================================================
PROJECT
==================================================

Project name:

ScanCart

TECH STACK:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router
- IndexedDB
- Existing IndexedDB wrapper from Phase 7
- ZXing scanner integration from Phase 8

CURRENT FUNCTIONALITY:

- Mobile-first interface
- Shopping sessions
- Store selection
- Shopping budget
- Basket management
- Manual product entry
- Barcode and QR scanning
- Known-product lookup
- IndexedDB persistence
- Product persistence
- Basket persistence
- Session persistence
- Price-record persistence
- Centralized calculations
- Budget tracking
- Centavo-safe monetary calculations

==================================================
PHASE 9 GOAL
==================================================

Implement completed Shopping History.

When the user finishes a shopping session, ScanCart must create a
permanent historical snapshot BEFORE clearing the active session and
basket.

The user must then be able to:

- View previous shopping trips
- See the store
- See the completion date/time
- See total spent
- See original budget
- See number of products/items
- Open a shopping trip
- Review every item purchased
- See the quantity, price, and subtotal recorded at that time
- See budget vs actual spending

Historical records must remain intact even if the current Product data
changes later.

Do NOT implement price-history analytics/charts in Phase 9.
That belongs to Phase 10.

==================================================
1. CORE DESIGN PRINCIPLE: SNAPSHOTS
==================================================

Shopping history must be historical.

Do NOT make historical sessions depend on the current mutable Product
records.

Example:

October 21 shopping trip:

Fresh Milk
₱95.00

The Product record is later updated:

Fresh Milk
₱105.00

The historical October 21 shopping trip must STILL display:

₱95.00

Therefore, completed shopping sessions must store snapshots of purchased
items.

Do not retrieve current product prices when rendering historical trips.

==================================================
2. SHOPPING HISTORY TYPES
==================================================

Create or update history types.

Suggested structure:

interface ShoppingHistoryItem {
  id: string;
  productId?: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  quantity: number;
}

interface ShoppingHistoryRecord {
  id: string;
  store: string;
  budget: number;
  total: number;
  productCount: number;
  itemCount: number;
  startedAt: string;
  completedAt: string;
  items: ShoppingHistoryItem[];
}

Adjust naming to match the existing ScanCart architecture.

Use strict TypeScript.

Do not use "any".

==================================================
3. HISTORICAL ITEM DATA
==================================================

Every ShoppingHistoryItem should preserve the values that were relevant
when the shopping session was completed.

At minimum preserve:

- Product ID when available
- Barcode when available
- Product name
- Brand when available
- Category when available
- Purchased price
- Quantity

Subtotal does NOT need to be stored if it can be safely calculated from:

price × quantity

Use the existing centavo-safe calculation strategy.

==================================================
4. SHOPPING HISTORY STORE
==================================================

Add an IndexedDB object store for shopping history if Phase 7 did not
already create one.

Suggested store:

shoppingHistory

If changing the IndexedDB schema requires a version upgrade:

Increment DB_VERSION correctly.

Example:

Version 1:
products
basket
sessions
priceHistory

Version 2:
products
basket
sessions
priceHistory
shoppingHistory

Do NOT delete or recreate the user's database.

Do NOT destroy existing products, baskets, sessions, or price records
during the schema upgrade.

Use the IndexedDB upgrade mechanism.

==================================================
5. SHOPPING HISTORY INDEXES
==================================================

Create useful indexes only where appropriate.

Possible indexes:

completedAt
store

Do not over-index the database.

The primary Phase 9 query is:

Get completed shopping trips ordered newest first.

If the IndexedDB wrapper can efficiently retrieve/sort the relatively
small local dataset without unnecessary complexity, choose the simplest
reliable solution.

==================================================
6. SHOPPING HISTORY REPOSITORY
==================================================

Create:

src/lib/db/shoppingHistory.ts

or the equivalent location in the existing repository structure.

Implement operations such as:

saveShoppingHistory(record)

getShoppingHistory()

getShoppingHistoryById(id)

deleteShoppingHistory(id)

clearShoppingHistory()

Names may be changed to match existing conventions.

Components must NOT contain raw IndexedDB operations.

Use:

UI
 ↓
Hook / Service
 ↓
Repository
 ↓
IndexedDB

==================================================
7. COMPLETE SHOPPING SESSION
==================================================

Update the existing End Shopping behavior.

Current Phase 8 behavior approximately:

Confirm End Shopping
        ↓
Clear session
        ↓
Clear basket

Phase 9 must change this to:

Confirm End Shopping
        ↓
Validate active session
        ↓
Read current basket
        ↓
Calculate final totals
        ↓
Create historical snapshot
        ↓
Persist shopping history
        ↓
ONLY AFTER SUCCESS:
Clear persisted basket
        ↓
Clear BasketContext
        ↓
Clear active persisted session
        ↓
Clear ShoppingSessionContext

This ordering is critical.

Do NOT clear shopping data before the history record has been
successfully saved.

==================================================
8. EMPTY SHOPPING SESSION
==================================================

Handle ending a shopping session with an empty basket.

Choose a clear ScanCart policy.

Preferred Phase 9 policy:

Do NOT create a shopping-history record for an empty basket.

If the user chooses End Shopping with no items:

Confirm that the empty session should be ended.

Then:

- Clear the active session
- Clear any empty basket state
- Do not create a history record

Keep the behavior simple and predictable.

==================================================
9. FINAL TOTAL
==================================================

When creating the history record, calculate the final total using the
existing centralized calculation utilities.

Do not trust a stale:

basketTotal

stored somewhere else.

Use the current basket items.

Example:

Milk:
₱95 × 2 = ₱190

Bread:
₱75 × 1 = ₱75

Final total:

₱265

Persist:

total: 265

This represents the actual calculated basket total when the session was
completed.

==================================================
10. PRODUCT COUNT
==================================================

Persist or derive the number of different product rows.

Example:

Milk × 2
Bread × 1
Coffee × 3

Product count:

3

Use the Phase 6 calculation utility.

Do not confuse product count with physical item count.

==================================================
11. ITEM COUNT
==================================================

Persist or derive total physical quantity.

Example:

Milk × 2
Bread × 1
Coffee × 3

Physical item count:

6

Use the Phase 6 calculation utility.

Do not use:

items.length

for physical quantity.

==================================================
12. BUDGET SNAPSHOT
==================================================

Store the budget that applied to the completed shopping session.

Example:

Budget:
₱3,000

Final total:
₱2,745.50

Historical record:

budget: 3000
total: 2745.50

Later changes to a user's default or future shopping budget must not
change historical records.

==================================================
13. STORE SNAPSHOT
==================================================

Persist the session's store.

Example:

store:
"SM Supermarket"

Do not read historical store names from a mutable current shopping
session when rendering history.

The history record owns the historical value.

==================================================
14. DATE AND TIME
==================================================

Preserve:

startedAt
completedAt

using ISO timestamps.

Example:

new Date().toISOString()

Do not store locale-formatted dates as the source value.

Display formatting belongs in the UI.

Use the user's local browser timezone when formatting history for display.

==================================================
15. HISTORY PAGE
==================================================

Create or update:

src/app/history/page.tsx

URL:

/history

Display completed shopping sessions.

Sort:

Newest completed session first.

Suggested mobile layout:

--------------------------------

Shopping History

October 21

SM Supermarket
6 Items

₱2,745.50

Budget ₱3,000.00

[ View Details ]

--------------------------------

October 14

Puregold
12 Items

₱2,115.25

Budget ₱2,500.00

[ View Details ]

--------------------------------

Do not display raw ISO timestamps to users.

==================================================
16. HISTORY CARD
==================================================

Create a reusable component such as:

src/components/history/ShoppingHistoryCard.tsx

Display:

- Store
- Date
- Total spent
- Item count
- Product count if useful
- Budget
- Budget status if useful

The card should be easy to tap on mobile.

Avoid cluttering the history list with every purchased product.

Detailed items belong in the details page.

==================================================
17. EMPTY HISTORY STATE
==================================================

When no completed sessions exist, show:

"No shopping history yet."

Supporting text:

"Completed shopping trips will appear here."

Optionally provide:

[ Start Shopping ]

Do not display a blank page.

==================================================
18. HISTORY DETAILS ROUTE
==================================================

Create a route for individual shopping trips.

Suggested structure:

src/app/history/[id]/page.tsx

Example URL:

/history/<history-id>

Do not expose sequential numeric IDs if the project currently uses
UUIDs.

Use the persisted history ID.

==================================================
19. HISTORY DETAILS PAGE
==================================================

Display:

- Store
- Date/time
- Started time if useful
- Completed time
- Budget
- Total spent
- Remaining budget or over-budget amount
- Product count
- Physical item count
- Every purchased item

Example:

--------------------------------

SM Supermarket

October 21, 2026

Budget
₱3,000.00

Total Spent
₱2,745.50

Remaining
₱254.50

12 Products
18 Items

--------------------------------

Fresh Milk

₱95.00 × 2

Subtotal
₱190.00

--------------------------------

Bread

₱75.00 × 1

Subtotal
₱75.00

--------------------------------

[ Delete History ]

--------------------------------

Use ScanCart's centralized currency formatter.

==================================================
20. HISTORICAL SUBTOTAL
==================================================

Calculate historical item subtotal from the historical snapshot:

historical price × historical quantity

Use centavo-safe logic.

Do not retrieve current Product.lastPrice.

Example:

History:

Milk
₱95 × 2

Current Product:

Milk
₱110

History MUST still show:

₱190

not:

₱220

==================================================
21. HISTORICAL BUDGET STATUS
==================================================

Reuse Phase 6 budget calculations.

Example:

Budget:
₱3,000

Spent:
₱2,745.50

Display:

Remaining
₱254.50

If:

Budget:
₱3,000

Spent:
₱3,150

Display:

Over Budget
₱150

Do not save unnecessary status strings if status can be reliably derived
from historical budget and total.

==================================================
22. HISTORY LOADING STATE
==================================================

IndexedDB loading is asynchronous.

Provide appropriate loading behavior.

Example:

"Loading shopping history..."

Do not briefly show:

"No shopping history yet"

while IndexedDB is still loading.

Distinguish:

loading
empty
success
error

==================================================
23. HISTORY ERROR STATE
==================================================

If history cannot be loaded:

Display a user-friendly message such as:

"We couldn't load your shopping history."

Provide:

[ Try Again ]

Do not expose raw IndexedDB exception messages.

Do not leave the page permanently in a loading state.

==================================================
24. HISTORY DETAIL NOT FOUND
==================================================

If the requested history ID does not exist:

Display:

"Shopping trip not found."

Provide:

[ Back to History ]

Do not crash the page.

Do not redirect to an unrelated session.

==================================================
25. DELETE SINGLE HISTORY RECORD
==================================================

Allow users to delete a specific historical shopping trip.

Require confirmation.

Example:

Delete this shopping trip?

"This removes this trip from your shopping history. Your saved products
will not be deleted."

Actions:

[ Cancel ]

[ Delete ]

When confirmed:

- Delete only that ShoppingHistoryRecord
- Do not delete Product records
- Do not delete unrelated PriceHistory records
- Do not delete other shopping trips
- Navigate back to /history after successful deletion

==================================================
26. DELETE CONFIRMATION SAFETY
==================================================

Deleting a historical record is destructive.

Do not perform deletion immediately after a single accidental tap.

Require explicit confirmation.

Cancel must leave history untouched.

Disable the final Delete action while the deletion is processing to avoid
duplicate operations.

==================================================
27. OPTIONAL CLEAR HISTORY
==================================================

If ScanCart already has an appropriate Settings area, a:

Clear Shopping History

action may be included.

If no Settings area exists, do NOT add a prominent Clear All button just
for Phase 9.

If implemented, Clear History must require strong confirmation.

It must NOT clear:

- Products
- Price history
- Current active session
- Current basket

unless explicitly designed otherwise.

==================================================
28. ACTIVE SESSION SAFETY
==================================================

Viewing historical shopping trips must not affect the current shopping
session.

Example:

Current active session:

Puregold
Basket: ₱500

User opens History and views:

Previous SM Supermarket trip

Expected:

Current Puregold session remains unchanged.
Current basket remains unchanged.

History views must be read-only except explicit delete actions.

==================================================
29. PRODUCT UPDATE SAFETY
==================================================

Editing or updating a Product after a shopping trip has been completed
must not modify that trip.

Example:

History snapshot:

Fresh Milk
Brand A
₱95

Later Product update:

Fresh Milk
Brand B
₱110

Expected historical record:

Brand A
₱95

The historical item snapshot must remain unchanged.

==================================================
30. PRODUCT DELETION SAFETY
==================================================

If a Product is deleted from the products store later, corresponding
shopping-history items must remain visible.

History should not rely on a foreign-key-style live Product lookup for
core display data.

productId may be kept for reference, but historical name/price/etc. must
come from the snapshot.

==================================================
31. DATE GROUPING
==================================================

For Phase 9, keep history grouping simple.

Default:

Newest first.

If helpful, history can be grouped by date/month.

Do not over-engineer filtering or analytics yet.

Possible future functionality:

- Filter by store
- Filter by month
- Spending charts
- Average grocery spend

These are not required in Phase 9.

==================================================
32. CURRENCY FORMATTING
==================================================

Reuse:

src/lib/currency.ts

All monetary values must use the same PHP formatter.

Examples:

₱0.00
₱95.00
₱1,250.50
₱3,000.00

Do not manually concatenate:

"₱" + value

Do not scatter toFixed() calls throughout history components.

==================================================
33. DATE FORMATTING UTILITY
==================================================

Create a small reusable formatting utility if one does not already
exist.

Possible:

src/lib/date.ts

Functions might include:

formatShoppingDate(timestamp)

formatShoppingDateTime(timestamp)

Use Intl.DateTimeFormat when appropriate.

Do not manually slice ISO date strings for user-facing display when a
locale-aware formatter is more appropriate.

==================================================
34. MOBILE-FIRST HISTORY UI
==================================================

Optimize for:

360px - 430px smartphone screens.

Requirements:

- History cards fit the screen width
- No horizontal scrolling
- Total spent is visually prominent
- Store and date are easy to identify
- Tap targets are comfortable
- Detail item rows remain readable
- Long product names wrap appropriately
- Bottom navigation remains usable

Desktop/tablet layouts should still remain clean.

==================================================
35. BOTTOM NAVIGATION
==================================================

Ensure the existing navigation includes:

Home
Scan
Basket
History

History should navigate to:

/history

Highlight History appropriately when the user is within:

/history

or:

/history/[id]

Do not break existing Scan, Basket, or Home navigation.

==================================================
36. HOME PAGE INTEGRATION
==================================================

Do not overload the Home page with full history.

If it fits the existing design, optionally show:

Recent Shopping

with one or a few recent sessions.

However, this is optional.

Primary history browsing belongs at:

/history

Do not duplicate full history UI on Home.

==================================================
37. COMPLETION SUCCESS FEEDBACK
==================================================

After End Shopping successfully saves history:

Show feedback such as:

"Shopping trip saved."

Then return the user to an appropriate location such as:

Home

or:

History

Follow the existing ScanCart navigation style.

The key requirement is:

History must be saved BEFORE context/database clearing occurs.

==================================================
38. HISTORY SAVE FAILURE
==================================================

This is important.

If saving ShoppingHistory fails:

DO NOT immediately clear:

- Basket
- Active shopping session

Because this could cause the user to lose their shopping record.

Instead:

- Keep current session data available
- Show a useful message

Example:

"We couldn't save this shopping trip. Your basket has not been cleared."

Provide:

[ Try Again ]

Do not silently lose the completed trip.

==================================================
39. DOUBLE-COMPLETION PROTECTION
==================================================

Prevent:

End Shopping
End Shopping
End Shopping

from creating duplicate history records.

While completion is being processed:

- Disable completion action
- Show a processing state

Example:

"Saving trip..."

Ensure one completed session maps to one historical record.

Consider using the ShoppingSession ID as part of duplicate protection.

==================================================
40. ATOMICITY / CONSISTENCY
==================================================

Use the safest practical IndexedDB transaction strategy.

The critical sequence is:

Save history
then
clear active data

If possible under the existing repository architecture, group closely
related database writes into a transaction.

At minimum, ensure failure during history creation does not destroy the
active basket/session.

Document the consistency strategy in the implementation only where
necessary.

Do not introduce complex distributed transaction logic.

Everything remains local in IndexedDB.

==================================================
41. HISTORY REPOSITORY SORTING
==================================================

getShoppingHistory() should produce predictable ordering:

Newest completedAt first.

Do not rely on accidental IndexedDB insertion order.

If sorting is done after retrieval, use completedAt explicitly.

Handle invalid/missing timestamps defensively without crashing the UI.

==================================================
42. STORE SEARCH/FILTERING
==================================================

Do NOT implement advanced filtering unless the existing History design
already supports it.

Phase 9 should prioritize:

- Correct persistence
- Correct snapshots
- Reliable trip completion
- History list
- History details
- Safe deletion

Search/filter functionality can be added later.

==================================================
43. HISTORICAL DATA IS READ-ONLY
==================================================

Do not allow users to modify item prices or quantities inside completed
shopping history during Phase 9.

History item:

Milk
₱95 × 2

is a record of what happened.

Users may:

- View it
- Delete the whole trip

Users should not edit the historical item's price or quantity.

==================================================
44. SCANNER INTEGRATION
==================================================

No changes should be required to core Phase 8 camera functionality.

However, confirm that products added through:

- Camera barcode scan
- Manual barcode lookup
- Manual product entry

all create normal BasketItems.

Therefore all three sources must be captured correctly when the basket
is converted into a historical snapshot.

Do not build separate history logic per item-entry method.

==================================================
45. PRICE HISTORY RELATIONSHIP
==================================================

Shopping History and Price History are different concepts.

Shopping History answers:

"What did I buy during this shopping trip?"

Price History answers:

"What prices have I recorded for this product over time?"

Do not combine these stores.

A completed shopping trip should not delete or overwrite price-history
records.

Phase 10 will build user-facing Price History functionality.

==================================================
46. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- Price-history charts
- Price trend analytics
- Cheapest-store calculations
- Store comparison
- Monthly spending analytics
- Receipt OCR
- Receipt photography
- External product APIs
- Cloud synchronization
- Supabase
- PostgreSQL
- Authentication
- Household sharing
- PWA installation
- Push notifications

These belong to later phases or optional future enhancements.

==================================================
47. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing ScanCart project.

Relevant structure may approximately become:

src/
│
├── app/
│   ├── page.tsx
│   ├── scan/
│   ├── basket/
│   ├── products/
│   │
│   └── history/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
│
├── components/
│   ├── history/
│   │   ├── ShoppingHistoryCard.tsx
│   │   ├── ShoppingHistoryList.tsx
│   │   └── ShoppingHistoryDetails.tsx
│   │
│   ├── basket/
│   ├── scanner/
│   ├── product/
│   └── shopping/
│
├── context/
│   ├── ShoppingSessionContext.tsx
│   └── BasketContext.tsx
│
├── hooks/
│   └── useShoppingHistory.ts
│
├── lib/
│   ├── db/
│   │   ├── database.ts
│   │   ├── products.ts
│   │   ├── basket.ts
│   │   ├── sessions.ts
│   │   ├── priceHistory.ts
│   │   └── shoppingHistory.ts
│   │
│   ├── calculations.ts
│   ├── currency.ts
│   ├── date.ts
│   └── validation.ts
│
└── types/
    ├── history.ts
    ├── product.ts
    ├── basket.ts
    ├── shopping.ts
    └── price.ts

Do NOT blindly create every listed file.

Reuse existing equivalents.

==================================================
48. REQUIRED TEST SCENARIOS
==================================================

Verify at minimum:

TEST 1: COMPLETE NORMAL SESSION

Session:

Store:
SM Supermarket

Budget:
₱3,000

Basket:

Milk
₱95 × 2

Bread
₱75 × 1

Expected:

Final total:
₱265

Product count:
2

Item count:
3

After End Shopping confirmation:

History contains the session.
Active basket is empty.
Active session is cleared.


TEST 2: HISTORY SURVIVES REFRESH

Complete a shopping trip.

Refresh ScanCart.

Expected:

Trip remains visible under:

/history


TEST 3: HISTORICAL PRICE SNAPSHOT

Complete:

Milk
₱95

Later update Product:

Milk
₱110

Expected history still displays:

₱95


TEST 4: HISTORICAL QUANTITY

Complete:

Milk
₱95 × 3

Expected history:

Quantity:
3

Subtotal:
₱285


TEST 5: OVER-BUDGET TRIP

Budget:

₱3,000

Final total:

₱3,150

Expected history details:

Budget:
₱3,000

Total:
₱3,150

Over Budget:
₱150


TEST 6: EXACT BUDGET

Budget:

₱3,000

Total:

₱3,000

Expected:

Remaining:
₱0

Must NOT show over budget.


TEST 7: EMPTY SESSION

Active session exists.

Basket empty.

End session.

Expected:

Session ends.
No shopping-history record is created.


TEST 8: HISTORY SAVE FAILURE

Simulate or handle history persistence failure.

Expected:

Active session remains.
Basket remains.
User sees save-error feedback.


TEST 9: DUPLICATE COMPLETION

Rapidly press End Shopping multiple times.

Expected:

Only one historical trip is created.


TEST 10: DELETE HISTORY

Delete one historical trip and confirm.

Expected:

That trip is removed.

Other history remains.

Products remain.

Price history remains.


TEST 11: CANCEL DELETE

Press Delete.

Choose Cancel.

Expected:

Historical record remains unchanged.


TEST 12: MISSING HISTORY ID

Open an invalid history ID.

Expected:

"Shopping trip not found."

No crash.


TEST 13: PRODUCT DELETED LATER

Complete history containing Milk.

Later delete Milk from products store.

Expected:

Historical trip still displays Milk using its snapshot.


TEST 14: CURRENT SESSION SAFETY

Active session:

Puregold

Basket:
₱500

View an older SM Supermarket history.

Expected:

Puregold session remains active.
Current basket remains ₱500.


TEST 15: NEWEST-FIRST SORTING

Create multiple completed sessions with different completedAt values.

Expected:

Newest completed session appears first.


TEST 16: CENTAVO ACCURACY

Basket:

Item A:
₱0.10

Item B:
₱0.20

Expected historical total:

₱0.30

Never:

₱0.30000000000000004


TEST 17: ZERO-PRICE ITEM

Complete trip containing:

Free Sample
₱0 × 2

Expected:

History keeps the item.
Quantity counts toward item count.
Subtotal displays ₱0.00.


TEST 18: SCANNED PRODUCT

Add product through Phase 8 scanner.

Complete shopping.

Expected:

Scanned product appears correctly in historical snapshot.


TEST 19: MANUAL PRODUCT

Add product through manual entry.

Complete shopping.

Expected:

Manual product appears correctly in historical snapshot.


TEST 20: DATABASE UPGRADE

Existing Phase 8 IndexedDB contains:

products
basket
sessions
priceHistory

Upgrade to the Phase 9 schema.

Expected:

shoppingHistory becomes available.

Existing Phase 8 records remain intact.

No existing user data is erased.

==================================================
49. TESTING
==================================================

Use the project's existing testing framework.

Add tests where practical for:

- Historical snapshot creation
- Final total calculation
- Product/item counts
- History sorting
- Budget status
- Empty-session handling
- Duplicate-completion prevention
- History deletion behavior
- Database migration logic where testable

Prefer testing pure snapshot-building logic separately from IndexedDB.

A useful pure function may be:

createShoppingHistorySnapshot(
  session,
  basketItems,
  completedAt
)

It should return a valid ShoppingHistoryRecord without modifying the
source objects.

==================================================
50. QUALITY CHECKS
==================================================

After implementation, run the relevant commands from package.json.

Verify:

- TypeScript passes
- ESLint passes
- Existing tests pass
- New tests pass
- Production build succeeds
- Existing IndexedDB data survives migration
- No current Product lookup controls historical prices
- No basket is cleared before history is saved
- No duplicate history record from repeated End Shopping
- History survives refresh
- History deletion does not remove products
- History views do not mutate active session
- No NaN or Infinity values
- No hydration errors
- No broken mobile layout
- Phases 1 through 8 still work

Fix all Phase 9-related problems before considering the phase complete.

==================================================
51. FINAL RESPONSE
==================================================

After completing Phase 9, report:

1. Files created
2. Files modified
3. Files removed, if any
4. Old DB version
5. New DB version
6. Database migration performed
7. shoppingHistory schema
8. History repository functions
9. Shopping snapshot strategy
10. Updated End Shopping behavior
11. History list functionality
12. History detail functionality
13. History deletion behavior
14. Empty-session behavior
15. History-save failure behavior
16. Duplicate-completion protection
17. Automated tests completed
18. TypeScript result
19. ESLint result
20. Test result
21. Production-build result
22. Known limitations

Do NOT start Phase 10 automatically.

Stop after Phase 9 is complete.
