Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 6 are already implemented.

Do not recreate the project.
Do not rename ScanCart.
Do not replace working functionality.
Do not start Phase 8.

Before writing code:

1. Inspect the existing project structure.
2. Review ShoppingSessionContext.
3. Review BasketContext.
4. Review Product, BasketItem, and ShoppingSession types.
5. Review calculations.ts, currency.ts, and validation.ts.
6. Review the manual product-entry workflow.
7. Review how products are currently converted into basket items.
8. Check package.json before adding dependencies.
9. Preserve all working behavior from Phases 1 through 6.

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
- IndexedDB for browser-side persistence

CURRENT FUNCTIONALITY:

- Mobile-first UI
- Home dashboard
- Shopping sessions
- Store and budget selection
- BasketContext
- Manual product entry
- Quantity controls
- Price editing
- Product removal
- Centralized basket calculations
- Centavo-safe money calculations
- Budget tracking
- Over-budget detection

==================================================
PHASE 7 GOAL
==================================================

Implement local data persistence using IndexedDB.

ScanCart must remember important shopping data across:

- Page refreshes
- Route changes
- Browser restarts when IndexedDB data remains available

Persist:

1. Products
2. Active shopping session
3. Current basket
4. Product price records

Prepare the database architecture for future shopping-history and
barcode-scanning phases.

Do NOT implement barcode camera scanning in Phase 7.

==================================================
1. DATABASE PRINCIPLES
==================================================

Use IndexedDB as the primary browser-side database.

Do NOT use localStorage as the main ScanCart database.

IndexedDB access must be isolated behind a database/repository layer.

React components must not directly contain raw IndexedDB operations.

Bad:

Component
   ↓
indexedDB.open(...)
   ↓
objectStore...

Preferred:

Component
   ↓
Context / Hook
   ↓
Repository
   ↓
Database Layer
   ↓
IndexedDB

This separation is important because ScanCart may use a cloud backend
in a future version.

==================================================
2. INDEXEDDB LIBRARY
==================================================

First inspect package.json.

If an IndexedDB wrapper is not already installed, use a lightweight,
well-maintained solution such as:

idb

Do not introduce multiple IndexedDB libraries.

Do not add a large state-management library just for persistence.

Keep the database implementation strongly typed.

==================================================
3. DATABASE NAME
==================================================

Use a clear database name.

Example:

scancart-db

Define database constants centrally.

Do not repeat database names or object-store names throughout the
project.

Example:

DB_NAME = "scancart-db"

DB_VERSION = 1

==================================================
4. DATABASE STRUCTURE
==================================================

Create a database layer.

Suggested location:

src/lib/db/

Possible structure:

src/lib/db/
├── database.ts
├── products.ts
├── basket.ts
├── sessions.ts
└── priceHistory.ts

Avoid putting every database operation into one huge file.

==================================================
5. OBJECT STORES
==================================================

Create IndexedDB object stores for:

products
basket
sessions
priceHistory

Prepare the architecture so a shoppingHistory store can be added in a
future phase.

Do NOT implement completed shopping history yet unless required for a
clean schema migration.

==================================================
6. PRODUCTS STORE
==================================================

Persist manually entered products.

Use the existing Product type.

Example Product:

{
  id: "product-123",
  barcode: "4801234567890",
  name: "Fresh Milk",
  brand: "Example Brand",
  category: "Dairy",
  lastPrice: 95,
  createdAt: "...",
  updatedAt: "..."
}

The products store should allow:

createProduct()

getProductById()

getProductByBarcode()

getAllProducts()

updateProduct()

deleteProduct()

Barcode lookup is particularly important because Phase 8 will use it
after camera scanning.

==================================================
7. BARCODE INDEX
==================================================

Create an IndexedDB index for product barcodes when appropriate.

Recommended:

barcode

The database must support efficient lookup such as:

getProductByBarcode("4801234567890")

IMPORTANT:

Barcodes must remain strings.

Example:

"0123456789012"

must remain:

"0123456789012"

Never convert barcode values to Number or parseInt.

Leading zeros must be preserved.

Handle products without barcodes.

If using a unique barcode index, ensure blank/undefined values do not
cause unexpected uniqueness failures.

Choose an implementation compatible with products that do not have a
barcode.

==================================================
8. PRODUCT CREATION INTEGRATION
==================================================

Update the Phase 5 manual product-entry workflow.

Current flow:

Product Form
     ↓
Create Product
     ↓
Create BasketItem
     ↓
BasketContext
     ↓
Basket

New Phase 7 flow:

Product Form
     ↓
Validate
     ↓
Check IndexedDB
     ↓
Create / Update Product
     ↓
Save Product
     ↓
Create BasketItem
     ↓
BasketContext
     ↓
Persist Basket
     ↓
Basket Page

If an entered barcode already exists in IndexedDB, do not blindly create
a duplicate Product.

Retrieve the existing product first.

==================================================
9. EXISTING PRODUCT POLICY
==================================================

When manually entering a barcode already stored in IndexedDB:

Example existing product:

Barcode:
4801234567890

Name:
Fresh Milk

Last Price:
₱95

New entry:

Barcode:
4801234567890

Price:
₱99

Use the existing Product ID.

Update:

lastPrice = 99
updatedAt = current timestamp

Do not create another Product record with the same barcode.

If the new form contains updated brand/category details, update them
according to the values submitted by the user.

==================================================
10. PRODUCT WITHOUT BARCODE
==================================================

Products without barcodes must still be supported.

Example:

{
  id: "...",
  barcode: undefined,
  name: "Fresh Pandesal",
  brand: undefined,
  category: "Bakery",
  lastPrice: 5,
  ...
}

Generate a unique product ID.

Do not attempt to identify products without barcodes purely by name.

"Apple"

and another:

"Apple"

may represent different products.

==================================================
11. BASKET PERSISTENCE
==================================================

Persist the current basket.

The basket store must preserve:

- Basket item ID
- Product ID
- Barcode when available
- Product name
- Current price
- Quantity

Example:

{
  id: "basket-item-123",
  productId: "product-456",
  barcode: "4801234567890",
  name: "Fresh Milk",
  price: 95,
  quantity: 2
}

The basket should survive a browser refresh.

==================================================
12. BASKET HYDRATION
==================================================

When ScanCart starts:

1. Initialize IndexedDB.
2. Load basket records.
3. Hydrate BasketContext.
4. Derive subtotal/total/item counts using Phase 6 calculations.

Do NOT persist calculated values such as:

basketTotal
itemCount
subtotal
remainingBudget
overBudgetAmount

These must continue to be derived from basket items.

Persist source data, not calculated data.

==================================================
13. BASKET WRITE OPERATIONS
==================================================

Persist basket changes when:

- Item is added
- Item is removed
- Quantity increases
- Quantity decreases
- Quantity is directly updated
- Price is edited
- Basket is cleared

Keep BasketContext and IndexedDB synchronized.

Do not require a manual Save Basket button.

==================================================
14. SHOPPING SESSION PERSISTENCE
==================================================

Persist the active ShoppingSession.

Existing type may resemble:

{
  id: "...",
  store: "SM Supermarket",
  budget: 3000,
  startedAt: "...",
  status: "active"
}

When the user starts shopping:

startSession()
      ↓
Context update
      ↓
IndexedDB save

When ScanCart reloads:

IndexedDB
      ↓
Retrieve active session
      ↓
ShoppingSessionContext

The user should not lose the active shopping session solely because the
browser refreshed.

==================================================
15. END SHOPPING
==================================================

Preserve existing behavior.

When the user confirms:

End Shopping

Phase 7 should:

1. Clear active ShoppingSession state.
2. Clear persisted active-session record.
3. Clear BasketContext.
4. Clear persisted basket.

Do NOT delete saved Product records.

Example:

Before:

Products:
152 saved products

Basket:
8 items

Active session:
SM Supermarket

After End Shopping:

Products:
152 saved products

Basket:
empty

Active session:
none

Product data should remain available for future shopping trips.

Do not implement completed shopping history yet.

==================================================
16. PRICE HISTORY STORE
==================================================

Create the persistence support needed for product price records.

Suggested type:

interface PriceHistoryRecord {
  id: string;
  productId: string;
  store: string;
  price: number;
  recordedAt: string;
}

Possible store:

priceHistory

Create repository operations such as:

addPriceRecord()

getPriceHistoryForProduct()

getLatestPriceForProduct()

Do not build the full Price History UI.

That belongs to Phase 10.

==================================================
17. PRICE RECORD CREATION
==================================================

When a product is manually added to the basket with a valid price and
active store, create a price record.

Example:

Product:

Fresh Milk
productId = "product-123"

Shopping session:

SM Supermarket

Entered price:

₱95.00

Create:

{
  id: "...",
  productId: "product-123",
  store: "SM Supermarket",
  price: 95,
  recordedAt: "..."
}

Avoid creating duplicate price records merely because React renders
again.

Price records should be created because of an explicit product-add or
price-confirmation action, not a render effect.

==================================================
18. PRICE HISTORY DUPLICATE POLICY
==================================================

Keep Phase 7 behavior simple and predictable.

If the user adds the same product repeatedly during the same active
shopping session at the same unchanged price, avoid creating unnecessary
identical history records if practical.

However:

If the price changes:

₱95 -> ₱99

a new price record may be created.

Do not build complicated price analytics in Phase 7.

==================================================
19. DATABASE INITIALIZATION
==================================================

Create a central database initialization function.

Example responsibility:

openScanCartDatabase()

It should:

- Open scancart-db
- Create stores during initial setup
- Create indexes
- Handle database version upgrades
- Return a reusable database connection/interface

Do not open entirely independent database connections throughout every
component.

==================================================
20. DATABASE VERSIONING
==================================================

Start with a defined schema version.

Example:

DB_VERSION = 1

Use IndexedDB's upgrade mechanism correctly.

Structure the code so future phases can use:

Version 2
Version 3

without deleting user data.

Do NOT delete and recreate the database on every schema change.

Avoid destructive migrations unless explicitly necessary.

==================================================
21. REPOSITORY LAYER
==================================================

Use repository functions to isolate persistence logic.

Products repository:

createProduct
getProductById
getProductByBarcode
getAllProducts
updateProduct
deleteProduct

Basket repository:

getBasketItems
saveBasketItem
updateBasketItem
deleteBasketItem
clearBasket

Session repository:

saveActiveSession
getActiveSession
clearActiveSession

Price repository:

addPriceRecord
getPriceHistoryForProduct
getLatestPriceForProduct

Names can differ if the existing project's naming convention suggests
better alternatives.

Keep responsibilities clear.

==================================================
22. ASYNC ERROR HANDLING
==================================================

IndexedDB operations are asynchronous.

Handle failures gracefully.

Examples:

- Database cannot open
- Transaction fails
- Product cannot be written
- Basket fails to load
- Session persistence fails

Do not leave ScanCart permanently stuck in a loading state.

Log useful development information using the project's existing error
handling conventions.

Provide user-friendly UI feedback where data safety is impacted.

Do not expose raw stack traces to users.

==================================================
23. LOADING STATE
==================================================

Context providers must account for initial IndexedDB loading.

Consider exposing:

isLoading

Example:

const {
  items,
  basketTotal,
  isLoading
} = useBasket();

Do not render:

"Your basket is empty"

before IndexedDB hydration finishes.

Otherwise the user may briefly see an incorrect empty state.

Provide a lightweight loading state.

==================================================
24. HYDRATION SAFETY
==================================================

Next.js renders on the server where browser APIs such as IndexedDB do
not exist.

IndexedDB code must only run in the browser.

Avoid:

ReferenceError: indexedDB is not defined

Do not access IndexedDB from Server Components.

Use Client Components, effects, hooks, or browser-only database modules
appropriately.

Avoid hydration mismatches.

==================================================
25. SSR / CLIENT BOUNDARIES
==================================================

IndexedDB is browser-side storage.

Use:

"use client"

only where required.

Do not unnecessarily convert the entire application into Client
Components.

Database repositories may rely on browser APIs, but static layout and
presentation components should remain Server Components where practical.

==================================================
26. PRODUCT LOOKUP SERVICE
==================================================

Create a clean internal lookup flow that Phase 8 can reuse.

Example:

findProductByBarcode(barcode)

Flow:

Barcode
   ↓
Normalize barcode
   ↓
IndexedDB barcode lookup
   ↓
Product | undefined

Do NOT add camera scanning.

The goal is only to prepare the lookup functionality.

==================================================
27. BARCODE NORMALIZATION
==================================================

Reuse or extend the Phase 5 normalization utility.

Example:

normalizeBarcode(value)

Behavior:

" 0123456789012 "

becomes:

"0123456789012"

Do NOT:

- Remove leading zeros
- Convert to number
- Invent missing digits
- Modify valid barcode content

==================================================
28. PRODUCT DATA OWNERSHIP
==================================================

Keep Product data separate from BasketItem data.

Products are persistent.

Basket items are temporary for the active shopping trip.

Example:

Persistent:

Product
 ├── ID
 ├── Barcode
 ├── Name
 ├── Brand
 ├── Category
 └── Last Price

Temporary active basket:

BasketItem
 ├── Product ID
 ├── Current Price
 └── Quantity

This distinction must remain clear.

==================================================
29. DATABASE DATA FLOW
==================================================

The intended architecture should approximately be:

             ScanCart UI
                  │
          Context / Hooks
            ┌─────┴─────┐
            │           │
        Products      Basket
            │           │
            └─────┬─────┘
                  │
             Repository
                  │
                  ▼
             IndexedDB
                  │
          scancart-db
        ┌─────────┼─────────┐
        │         │         │
     products   basket   sessions
        │
   priceHistory

Do not bypass the repository architecture from page components.
================================================== 
30. DATA RESET UTILITY
================================================== 
For development/debugging, provide a safe internal function to clear ScanCart local data.
Prefer a function such as:
clearScanCartData()
It may clear:
	• products
	• basket
	• sessions
	• priceHistory
Do NOT expose a prominent destructive reset button in the production UI unless the app already has an appropriate settings/developer section.
Require explicit intent before destructive clearing if exposed in UI.
================================================== 
31. DATA CONSISTENCY
================================================== 
Avoid these situations:
Context says:
Quantity = 3
IndexedDB says:
Quantity = 2
or:
Context contains product IndexedDB does not contain product
Persistence operations should update in a predictable order.
If a persistence write fails, avoid silently pretending the data was saved successfully.
Choose and document a simple consistency strategy.
Do not implement complex offline synchronization yet.
================================================== 
32. ID GENERATION
================================================== 
Use a safe client-side ID strategy.
Prefer the project's existing ID generation method.
If none exists, use:
crypto.randomUUID()
when supported by the project's browser requirements.
Keep IDs as strings.
Do not use array indexes as persistent database IDs.
================================================== 
33. TIMESTAMPS
================================================== 
Use a consistent timestamp format.
Prefer ISO strings.
Example:
new Date().toISOString()
Persist:
createdAt updatedAt recordedAt startedAt
using the project's established timestamp convention.
Do not store locale-formatted date strings as database source values.
Formatting belongs in the UI layer.
================================================== 
34. DO NOT PERSIST DERIVED VALUES
================================================== 
Do NOT persist:
basketTotal itemSubtotal itemCount productCount remainingBudget overBudgetAmount usagePercentage budgetStatus
These values are already derived through Phase 6 calculation utilities.
Persist:
Product source data Basket item source data Session source data Price records
Then calculate UI values from those records.
================================================== 
35. DO NOT IMPLEMENT YET
================================================== 
Do NOT implement:
	• Camera barcode scanning
	• QR camera scanning
	• ZXing scanner
	• Camera permissions
	• External product APIs
	• Supabase
	• PostgreSQL
	• User accounts
	• Authentication
	• Cloud synchronization
	• Completed shopping history UI
	• Price history charts
	• Price comparison analytics
	• PWA installation
	• Service worker
	• Push notifications
These belong to later phases.
================================================== 
36. EXPECTED PROJECT STRUCTURE
================================================== 
Integrate with the existing ScanCart project.
Relevant structure may approximately become:
src/ │ ├── app/ 
│ ├── page.tsx 
│ ├── basket/ 
│ │ └── page.tsx 
│ └── products/ 
│ └── new/ 
│ └── page.tsx 
│ ├── components/ 
│ ├── basket/ 
│ ├── product/ 
│ └── shopping/ 
│ ├── context/ 
│ ├── ShoppingSessionContext.tsx 
│ └── BasketContext.tsx 
│ ├── lib/ 
│ ├── db/ 
│ │ ├── database.ts 
│ │ ├── products.ts 
│ │ ├── basket.ts 
│ │ ├── sessions.ts 
│ │ └── priceHistory.ts 
│ │ │ ├── calculations.ts 
│ ├── currency.ts 
│ └── validation.ts 
│ └── types/ 
├── product.ts 
├── basket.ts 
├── shopping.ts 
└── price.ts
Do not create duplicate files if equivalent functionality already exists.
================================================== 
37. REQUIRED TEST SCENARIOS
================================================== 
Verify at minimum:
TEST 1: PRODUCT PERSISTENCE
Create:
Fresh Milk Barcode: 4801234567890 Price: ₱95
Refresh the application.
Expected:
Product remains in IndexedDB.
TEST 2: BARCODE WITH LEADING ZERO
Create product:
Barcode:
0123456789012
Refresh.
Expected stored value:
0123456789012
It must NOT become:
123456789012
TEST 3: PRODUCT WITHOUT BARCODE
Create:
Fresh Pandesal No barcode
Expected:
Product saves successfully with a unique ID.
TEST 4: EXISTING BARCODE
Existing:
4801234567890 Fresh Milk ₱95
Enter again:
4801234567890 Fresh Milk ₱99
Expected:
Existing product is updated.
Do not create two persistent Product records with the same barcode.
TEST 5: ACTIVE SESSION PERSISTENCE
Start:
Store: SM Supermarket
Budget: ₱3,000
Refresh.
Expected:
Session is still active.
Store: SM Supermarket
Budget: ₱3,000
TEST 6: BASKET PERSISTENCE
Basket:
Milk ₱95 × 2
Bread ₱75 × 1
Refresh.
Expected:
Both basket items remain.
Expected calculated basket total:
₱265
TEST 7: QUANTITY PERSISTENCE
Milk quantity:
1 -> 2 -> 3
Refresh.
Expected:
Quantity remains 3.
TEST 8: PRICE EDIT PERSISTENCE
Milk:
₱95 -> ₱99
Refresh.
Expected:
Basket price remains ₱99.
TEST 9: REMOVE ITEM
Remove Bread.
Refresh.
Expected:
Bread does not return.
TEST 10: END SHOPPING
Products database contains:
Fresh Milk Bread Coffee
Active basket contains:
Milk Bread
End Shopping and confirm.
Expected:
Active session: cleared
Basket: cleared
Products: still saved
TEST 11: END SHOPPING CANCEL
Select End Shopping.
Choose Cancel.
Expected:
Session remains. Basket remains. IndexedDB records remain unchanged.
TEST 12: PRICE RECORD
Add:
Fresh Milk SM Supermarket ₱95
Expected price record:
productId = Fresh Milk product ID store = SM Supermarket price = 95
A valid recordedAt timestamp exists.
TEST 13: RELOAD CALCULATIONS
Before refresh:
Budget: ₱3,000
Basket: ₱265
Remaining: ₱2,735
Refresh.
Expected:
Budget: ₱3,000
Basket: ₱265
Remaining: ₱2,735
The derived values should be recalculated from persisted source data.
TEST 14: EMPTY DATABASE
Start ScanCart with no database records.
Expected:
Application loads normally.
No: NaN Infinity undefined database crash
TEST 15: DATABASE FAILURE
Simulate or handle an IndexedDB error where practical.
Expected:
ScanCart exits loading state.
A useful error path exists.
The application must not remain permanently stuck.
================================================== 
38. DATABASE TESTING
================================================== 
If the existing project already has a test framework:
Add tests for repository operations where practical.
Prioritize:
	• Barcode normalization
	• Duplicate barcode handling
	• Product persistence logic
	• Basket persistence
	• Session persistence
	• Derived calculations after hydration
Do not introduce an overly complicated browser-testing framework solely for Phase 7.
If IndexedDB integration cannot be meaningfully tested in the existing test environment, keep repository functions small and test pure logic separately.
================================================== 
39. QUALITY CHECK
================================================== 
After implementation, run all relevant commands available in package.json.
Verify:
	• TypeScript passes
	• ESLint passes
	• Existing tests pass
	• New tests pass
	• Production build succeeds
	• No hydration errors
	• No "indexedDB is not defined" server errors
	• No duplicate Context providers
	• No duplicate products for identical barcodes
	• No loss of leading barcode zeros
	• No basket loss after refresh
	• No active-session loss after refresh
	• No NaN/Infinity totals
	• Phase 1 through Phase 6 functionality still works
Fix all Phase 7-related errors before considering the phase complete.
================================================== 
40. FINAL RESPONSE
================================================== 
After completing Phase 7, report:
	1. Files created
	2. Files modified
	3. Files removed
	4. Dependency added, if any
	5. IndexedDB database name
	6. Database schema version
	7. Object stores created
	8. Indexes created
	9. Repository functions implemented
	10. Product persistence behavior
	11. Basket persistence behavior
	12. Session persistence behavior
	13. Price-record behavior
	14. Hydration strategy
	15. Duplicate-barcode strategy
	16. Tests performed
	17. TypeScript result
	18. ESLint result
	19. Test result
	20. Production-build result
	21. Known limitations
Do NOT start Phase 8 automatically.
Stop after Phase 7 is complete.