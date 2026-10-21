Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 5 are already implemented.

Do not recreate the project.
Do not replace working functionality.
Do not rename ScanCart.
Do not start Phase 7.

Before writing code:

1. Inspect the existing project structure.
2. Review ShoppingSessionContext.
3. Review BasketContext.
4. Review the Product and BasketItem types.
5. Review the Home, Basket, and Manual Product Entry pages.
6. Review currency.ts, calculations.ts, and validation.ts.
7. Identify duplicated calculation logic.
8. Reuse existing components and utilities where appropriate.
9. Preserve all working features from Phases 1 through 5.

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

CURRENT FUNCTIONALITY:

- Mobile-first layout
- Home dashboard
- Shopping sessions
- Store selection
- Shopping budget
- Basket state management
- Manual product entry
- Product and basket item types
- Quantity controls
- Price editing
- Item removal
- Basic subtotals and basket totals
- Remaining-budget display
- Over-budget warning
- End-shopping confirmation

==================================================
PHASE 6 GOAL
==================================================

Create a reliable, centralized calculation system for ScanCart.

All basket, quantity, subtotal, total, and budget calculations must use
shared calculation utilities.

The Home page, Basket page, Budget Card, Basket Summary, and any other
price display must show consistent values derived from the same basket
state.

This phase must improve calculation reliability without rebuilding the
existing application.

Do NOT implement IndexedDB, barcode scanning, camera access, cloud
storage, authentication, or shopping history in this phase.

==================================================
1. CALCULATION PRINCIPLES
==================================================

Follow these principles:

- Basket items are the source of truth for basket calculations.
- Do not store item subtotal as mutable state.
- Do not store basket total as independently editable state.
- Do not duplicate calculation formulas across components.
- Do not calculate monetary totals directly inside JSX.
- Use reusable, pure utility functions.
- Validate numeric inputs before allowing them into application state.
- Return predictable values for empty arrays.
- Never return NaN or Infinity to the UI.

Derived values include:

- Item subtotal
- Number of unique product rows
- Total physical item quantity
- Basket total
- Remaining budget
- Over-budget amount
- Budget usage percentage
- Average price per physical item

==================================================
2. MONEY CALCULATION STRATEGY
==================================================

Avoid floating-point errors in monetary calculations.

JavaScript floating-point arithmetic can produce results such as:

0.1 + 0.2 = 0.30000000000000004

For ScanCart, normalize monetary calculations using integer centavos.

Example:

₱95.50 should be represented during calculations as:

9550 centavos

Create helpers such as:

toCentavos(amount: number): number

fromCentavos(centavos: number): number

Suggested behavior:

toCentavos(95.5) returns 9550

fromCentavos(9550) returns 95.5

Use appropriate rounding when converting to centavos.

Do not change existing domain types to strings.

Product and BasketItem prices may remain numbers, but all aggregation
and multiplication should use centavos internally.

Do not introduce a large external money library unless the existing
project already uses one.

==================================================
3. ITEM SUBTOTAL
==================================================

Implement or improve:

calculateItemSubtotal(item: BasketItem): number

Calculation:

item price × quantity

Use centavo-safe arithmetic.

Example:

Price:
₱95.50

Quantity:
3

Expected subtotal:

₱286.50

The function must not mutate the BasketItem.

Expected behavior for valid input:

calculateItemSubtotal({
  price: 95.5,
  quantity: 3
})

returns:

286.5

Invalid price or quantity values should not normally reach this function
because validation must occur before state updates.

However, the function should fail safely and predictably if corrupt data
is encountered.

Do not display NaN or Infinity.

==================================================
4. PRODUCT ROW COUNT
==================================================

Implement:

calculateProductRowCount(items: BasketItem[]): number

This represents the number of different basket rows.

Example:

Milk, quantity 2
Bread, quantity 1
Coffee, quantity 3

Product row count:

3

This value may also be labeled as:

3 Products

Do not confuse this with total physical item quantity.

For an empty basket, return:

0

==================================================
5. TOTAL ITEM QUANTITY
==================================================

Implement:

calculateBasketItemCount(items: BasketItem[]): number

This represents the total number of physical items.

Example:

Milk, quantity 2
Bread, quantity 1
Coffee, quantity 3

Total item count:

6

Calculation:

sum(item.quantity)

Do not use:

items.length

because that only returns the number of product rows.

For an empty basket, return:

0

==================================================
6. BASKET TOTAL
==================================================

Implement or improve:

calculateBasketTotal(items: BasketItem[]): number

Calculation:

sum of all item subtotals

Use integer centavos internally.

Example:

Milk:
₱95.50 × 2 = ₱191.00

Bread:
₱75.25 × 1 = ₱75.25

Coffee:
₱120.10 × 2 = ₱240.20

Expected basket total:

₱506.45

For an empty basket, return:

0

Do not maintain basket total as unrelated mutable state.

BasketContext should derive it from the current items.

==================================================
7. REMAINING BUDGET
==================================================

Implement or improve:

calculateRemainingBudget(
  budget: number,
  basketTotal: number
): number

Calculation:

budget - basketTotal

Examples:

Budget:
₱3,000.00

Basket:
₱1,250.00

Remaining:

₱1,750.00

If the basket total exceeds the budget, this function may return a
negative value.

Example:

Budget:
₱3,000.00

Basket:
₱3,150.00

Remaining value:

-₱150.00

The UI should use this result to determine whether to display
"Remaining" or "Over Budget."

==================================================
8. OVER-BUDGET CALCULATION
==================================================

Implement:

calculateOverBudgetAmount(
  budget: number,
  basketTotal: number
): number

Expected behavior:

If basketTotal <= budget:

return 0

If basketTotal > budget:

return basketTotal - budget

Examples:

Budget:
₱3,000

Basket:
₱2,500

Over-budget amount:

₱0

Budget:
₱3,000

Basket:
₱3,150

Over-budget amount:

₱150

The UI must not display a negative over-budget amount.

==================================================
9. BUDGET STATUS
==================================================

Create a reusable budget-status function.

Suggested type:

type BudgetStatus =
  | "no-budget"
  | "within-budget"
  | "near-budget"
  | "over-budget";

Suggested function:

getBudgetStatus(
  budget: number,
  basketTotal: number
): BudgetStatus

Use the following rules:

- If budget is 0 and the project treats 0 as no configured budget,
  return "no-budget".
- If basketTotal exceeds budget, return "over-budget".
- If basketTotal is at least 80% of budget but does not exceed the
  budget, return "near-budget".
- Otherwise, return "within-budget".

Examples:

Budget ₱3,000
Basket ₱1,500
Status: within-budget

Budget ₱3,000
Basket ₱2,400
Status: near-budget

Budget ₱3,000
Basket ₱3,001
Status: over-budget

Review how Phase 3 currently interprets a zero budget. Preserve the
existing behavior where possible and document the policy.

==================================================
10. BUDGET USAGE PERCENTAGE
==================================================

Implement:

calculateBudgetUsagePercentage(
  budget: number,
  basketTotal: number
): number

Example:

Budget:
₱3,000

Basket:
₱1,500

Usage:

50

Requirements:

- Return a numeric percentage.
- Avoid division by zero.
- If budget is zero, return 0.
- Do not return NaN or Infinity.
- Allow values greater than 100 when over budget.

Example:

Budget:
₱3,000

Basket:
₱3,300

Usage:

110

For visual progress bars, clamp the visual width separately to a maximum
of 100%.

Do not incorrectly hide the actual percentage from text output.

==================================================
11. AVERAGE PRICE PER ITEM
==================================================

Implement:

calculateAveragePricePerItem(
  items: BasketItem[]
): number

Calculation:

basket total / total physical item quantity

Example:

Basket total:
₱600

Total physical items:
6

Average price per item:

₱100

For an empty basket, return:

0

Do not divide by zero.

This value can be included in Basket Summary if it fits the existing UI,
but it must not clutter the mobile interface.

==================================================
12. CENTRAL CALCULATION FILE
==================================================

Use or update:

src/lib/calculations.ts

It should contain pure calculation functions.

Suggested exports:

toCentavos
fromCentavos
calculateItemSubtotal
calculateProductRowCount
calculateBasketItemCount
calculateBasketTotal
calculateRemainingBudget
calculateOverBudgetAmount
calculateBudgetUsagePercentage
calculateAveragePricePerItem
getBudgetStatus

Requirements:

- No React hooks inside this file
- No Context access
- No browser APIs
- No navigation
- No component rendering
- No mutation of input arrays or objects
- Strong TypeScript parameter and return types

==================================================
13. BASKET CONTEXT INTEGRATION
==================================================

Review:

src/context/BasketContext.tsx

BasketContext should expose calculated values derived from items.

Suggested values:

items
productCount
itemCount
basketTotal
averagePricePerItem

Suggested actions:

addItem()
removeItem()
increaseQuantity()
decreaseQuantity()
updateQuantity()
updatePrice()
clearBasket()

Do not create independent mutable state for:

productCount
itemCount
basketTotal
averagePricePerItem

Derive these values from:

items

Use React useMemo only when it improves clarity or avoids unnecessary
recalculation.

Avoid premature optimization.

==================================================
14. SHOPPING SESSION INTEGRATION
==================================================

Review:

src/context/ShoppingSessionContext.tsx

The active session should continue to provide:

- Current store
- Shopping budget
- Session status
- Start time

The basket should continue to provide:

- Current items
- Basket total
- Item count

Do not merge ShoppingSessionContext and BasketContext unless the existing
architecture clearly requires it.

Budget calculations should combine:

activeSession.budget
basketTotal

without duplicating either value.

==================================================
15. BUDGET SUMMARY TYPE
==================================================

Consider creating a derived budget summary type.

Example:

interface BudgetSummary {
  budget: number;
  basketTotal: number;
  remainingBudget: number;
  overBudgetAmount: number;
  usagePercentage: number;
  status: BudgetStatus;
}

Create a helper such as:

calculateBudgetSummary(
  budget: number,
  basketTotal: number
): BudgetSummary

Use this only if it reduces duplicated calculations across the Home and
Basket pages.

Do not create unnecessary abstraction if equivalent functionality
already exists.

==================================================
16. HOME PAGE INTEGRATION
==================================================

Update the ScanCart Home page to use the centralized calculations.

When a session is active, display:

- Store
- Budget
- Basket total
- Remaining budget or over-budget amount
- Budget status
- Total item quantity

Example:

Shopping at
SM Supermarket

Budget
₱3,000.00

Basket Total
₱1,250.50

Items
7

Remaining
₱1,749.50

Values must come from:

ShoppingSessionContext
BasketContext
Shared calculation utilities

Do not use placeholder or hard-coded totals.

==================================================
17. BASKET PAGE INTEGRATION
==================================================

Update the Basket page to use centralized calculations.

Display:

- Product row count
- Total physical item quantity
- Item subtotals
- Basket total
- Budget
- Remaining amount
- Over-budget amount when applicable

Example:

3 Products
6 Items

Basket Total
₱506.45

Budget
₱3,000.00

Remaining
₱2,493.55

Do not recalculate these values using inline reduce operations inside
the page when BasketContext or calculations.ts already provides them.

==================================================
18. BUDGET CARD INTEGRATION
==================================================

Update:

src/components/shopping/BudgetCard.tsx

The component should display consistent values.

Possible display states:

NO BUDGET

Basket Total
₱500.00

No shopping budget set


WITHIN BUDGET

Budget
₱3,000.00

Basket Total
₱1,500.00

Remaining
₱1,500.00


NEAR BUDGET

Budget
₱3,000.00

Basket Total
₱2,500.00

Remaining
₱500.00

You're nearing your budget.


OVER BUDGET

Budget
₱3,000.00

Basket Total
₱3,150.00

Over Budget
₱150.00

Use text and visual treatment to communicate status.

Do not rely only on color.

==================================================
19. BUDGET PROGRESS INDICATOR
==================================================

Add a simple accessible budget progress indicator if it fits the
existing design.

Requirements:

- Show how much of the budget has been used.
- Include accessible text.
- Clamp visual width between 0% and 100%.
- Preserve actual usage percentage in accompanying text.
- Provide a clear over-budget state.

Example:

Budget used
83%

[████████████████░░░░]

If actual usage is 110%, the bar may visually remain at 100%, but the
text must show:

110% used

Use appropriate ARIA attributes if implementing a progressbar.

Do not show a percentage bar when no budget has been configured.

==================================================
20. CURRENCY FORMATTING
==================================================

Review:

src/lib/currency.ts

Use one centralized formatter for Philippine Peso.

Suggested output:

₱0.00
₱95.00
₱1,250.50
₱3,000.00

Use:

Intl.NumberFormat

with an appropriate Philippine Peso configuration if that matches the
existing project.

Do not manually concatenate:

"₱" + value

Do not call toFixed() throughout individual components.

Do not allow the UI to display:

₱NaN
₱Infinity
undefined
null

If a corrupt value reaches the formatter, handle it predictably.

==================================================
21. QUANTITY VALIDATION
==================================================

Ensure basket quantity operations preserve valid values.

Requirements:

- Quantity must be a finite integer.
- Quantity must be at least 1.
- Increasing quantity adds exactly 1.
- Decreasing quantity subtracts exactly 1.
- Quantity must not go below 1.
- Invalid quantities must not enter BasketContext.

Examples:

1 -> decrease -> remains 1

1 -> increase -> 2

2 -> increase -> 3

Quantity 1.5 -> rejected

Quantity NaN -> rejected

Quantity Infinity -> rejected

==================================================
22. PRICE VALIDATION
==================================================

Ensure price-editing and product-entry workflows use consistent price
validation.

Requirements:

- Price must be a finite number.
- Price must be zero or greater.
- Decimal prices are allowed.
- Negative values are rejected.
- NaN is rejected.
- Infinity is rejected.
- Monetary values are normalized to two decimal places when stored or
  calculated.

Examples:

95 -> valid

95.5 -> valid and displayed as ₱95.50

95.555 -> normalize according to the chosen centavo-rounding policy

-1 -> invalid

NaN -> invalid

Infinity -> invalid

Document the rounding policy in code comments only where needed.

==================================================
23. ZERO-PRICE PRODUCTS
==================================================

Preserve the Phase 5 rule that a product price may be zero if the current
validation already permits it.

Examples may include:

- Promotional item
- Free sample
- Complimentary product

A zero-price item should:

- Remain visible in the basket
- Count toward physical item quantity
- Have a subtotal of ₱0.00
- Not increase the basket total

Do not silently remove zero-price items.

==================================================
24. EMPTY BASKET BEHAVIOR
==================================================

For an empty basket, calculations must return:

Product count:
0

Item count:
0

Basket total:
₱0.00

Average price:
₱0.00

Over-budget amount:
₱0.00

No calculation may return:

NaN
Infinity
undefined

Preserve the existing empty-basket UI.

==================================================
25. STATE CONSISTENCY
==================================================

There must be one source of truth for basket items.

The same calculated values must appear in:

- Home page
- Basket page
- Budget Card
- Basket Summary
- Navigation badge, if one exists

Example:

If Basket page shows:

Basket Total:
₱506.45

Home must also show:

Basket Total:
₱506.45

Do not create page-specific totals.

==================================================
26. EDITING PRICE AND QUANTITY
==================================================

When a user edits an item's price or quantity:

1. Validate the new value.
2. Update BasketContext.
3. Recalculate that item's subtotal.
4. Recalculate basket total.
5. Recalculate item count.
6. Recalculate remaining budget.
7. Recalculate budget percentage.
8. Recalculate over-budget status.

All affected UI must update immediately.

Do not require a full page refresh.

==================================================
27. END SHOPPING INTEGRATION
==================================================

Preserve existing Phase 3 and Phase 4 behavior.

If the user confirms:

End Shopping

then:

- Clear the active shopping session.
- Clear the basket.
- Derived calculations should return empty/default values.

If the user selects:

Cancel

then:

- Keep the active session.
- Keep all basket items.
- Keep all totals unchanged.

Do not implement shopping history yet.

==================================================
28. REUSABLE SUMMARY COMPONENT
==================================================

Review:

src/components/basket/BasketSummary.tsx

It should consume centralized calculated values rather than duplicating
calculation logic.

Possible content:

Products
3

Items
6

Basket Total
₱506.45

Budget
₱3,000.00

Remaining
₱2,493.55

Keep the component mobile-friendly.

Avoid showing too many secondary statistics if this makes the interface
crowded.

==================================================
29. ERROR HANDLING
==================================================

Handle calculation inputs safely.

At minimum, prevent these values from reaching the UI:

- NaN
- Infinity
- Negative quantity
- Fractional quantity
- Negative price
- Missing basket item arrays
- Undefined budget values

Do not silently correct invalid user-entered data when displaying a form.

Show an appropriate validation error before updating application state.

If unexpectedly corrupt state is encountered, use a predictable safe
result and report the issue during development.

==================================================
30. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- IndexedDB
- localStorage persistence
- Barcode camera scanning
- QR camera scanning
- Camera permissions
- ZXing
- Product lookup APIs
- Supabase
- PostgreSQL
- Authentication
- Cloud synchronization
- Shopping history
- Price history
- PWA installation
- Service workers
- Push notifications

These belong to later phases.

==================================================
31. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing ScanCart architecture.

The relevant files may approximately be:

src/
│
├── app/
│   ├── page.tsx
│   ├── basket/
│   │   └── page.tsx
│   └── products/
│       └── new/
│           └── page.tsx
│
├── components/
│   ├── basket/
│   │   ├── BasketItem.tsx
│   │   ├── BasketSummary.tsx
│   │   └── QuantityControl.tsx
│   │
│   └── shopping/
│       └── BudgetCard.tsx
│
├── context/
│   ├── ShoppingSessionContext.tsx
│   └── BasketContext.tsx
│
├── lib/
│   ├── calculations.ts
│   ├── currency.ts
│   └── validation.ts
│
└── types/
    ├── shopping.ts
    ├── basket.ts
    └── product.ts

Do not create duplicate files if equivalent functionality already exists.

==================================================
32. UNIT TESTS
==================================================

If the project already has a testing framework, add unit tests for the
calculation utilities.

If no testing framework exists, inspect package.json and add a minimal
test setup only if it is appropriate and does not require restructuring
the project.

Prefer testing pure calculation functions.

Possible test file:

src/lib/calculations.test.ts

Do not add a large or unrelated testing stack.

==================================================
33. REQUIRED TEST SCENARIOS
==================================================

Verify at least the following scenarios.

TEST 1: EMPTY BASKET

Items:

[]

Expected:

Product count = 0
Item count = 0
Basket total = ₱0.00
Average price = ₱0.00
Over-budget amount = ₱0.00


TEST 2: SINGLE ITEM

Milk:

Price = ₱95.00
Quantity = 1

Expected:

Subtotal = ₱95.00
Product count = 1
Item count = 1
Basket total = ₱95.00


TEST 3: MULTIPLE QUANTITIES

Milk:

₱95.00 × 2 = ₱190.00

Bread:

₱75.00 × 3 = ₱225.00

Expected:

Product count = 2
Item count = 5
Basket total = ₱415.00


TEST 4: DECIMAL PRICE

Product:

₱95.50 × 3

Expected subtotal:

₱286.50


TEST 5: FLOATING-POINT SAFETY

Item A:

₱0.10 × 1

Item B:

₱0.20 × 1

Expected basket total:

₱0.30

The result must not display:

₱0.30000000000000004


TEST 6: REMAINING BUDGET

Budget:

₱3,000.00

Basket:

₱1,250.50

Expected remaining:

₱1,749.50


TEST 7: EXACT BUDGET

Budget:

₱3,000.00

Basket:

₱3,000.00

Expected:

Remaining = ₱0.00
Over-budget amount = ₱0.00
Status is not over-budget


TEST 8: OVER BUDGET

Budget:

₱3,000.00

Basket:

₱3,150.00

Expected:

Over-budget amount = ₱150.00
Usage percentage = 105
Status = over-budget


TEST 9: NEAR BUDGET

Budget:

₱3,000.00

Basket:

₱2,400.00

Expected:

Usage percentage = 80
Status = near-budget


TEST 10: ZERO BUDGET

Budget:

₱0.00

Basket:

₱500.00

Expected:

No division by zero
No NaN
No Infinity

Use the existing ScanCart zero-budget policy to determine the displayed
status.


TEST 11: ZERO-PRICE ITEM

Free Sample:

Price = ₱0.00
Quantity = 2

Expected:

Product count = 1
Item count = 2
Subtotal = ₱0.00
Basket total = ₱0.00


TEST 12: QUANTITY UPDATE

Milk:

₱95.00 × 1 = ₱95.00

Increase quantity to 2.

Expected:

Subtotal = ₱190.00
Item count = 2
Basket total = ₱190.00


TEST 13: PRICE UPDATE

Milk:

Quantity = 2
Old price = ₱95.00
New price = ₱99.00

Expected:

Subtotal = ₱198.00
Basket total updates immediately


TEST 14: REMOVE ITEM

Milk:

₱95.00 × 2

Bread:

₱75.00 × 1

Remove Bread.

Expected:

Product count = 1
Item count = 2
Basket total = ₱190.00


TEST 15: CLEAR BASKET

Clear all basket items.

Expected:

Product count = 0
Item count = 0
Basket total = ₱0.00
All derived values return safe defaults


TEST 16: AVERAGE PRICE

Basket total:

₱600.00

Physical item count:

6

Expected average price:

₱100.00


TEST 17: CENTAVO ROUNDING

Price:

₱10.555

Quantity:

1

Expected:

Normalize using the selected two-decimal centavo policy.

The result must be consistent across:

- Item subtotal
- Basket total
- Currency display

==================================================
34. QUALITY CHECKS
==================================================

After implementation, run the existing project checks.

At minimum, run the relevant available commands from package.json, such
as:

- TypeScript checking
- ESLint
- Unit tests
- Production build

Verify:

- No new TypeScript errors
- No new ESLint errors
- No failing calculation tests
- No invalid imports
- No broken routes
- No hydration errors
- No duplicate calculation implementations
- No page-specific basket totals
- No NaN or Infinity in the UI
- No regressions in Phases 1 through 5
- Mobile layout has no horizontal overflow

Fix all problems introduced by Phase 6 before considering it complete.

==================================================
35. FINAL RESPONSE
==================================================

After completing Phase 6, report:

1. Files created
2. Files modified
3. Files removed, if any
4. Calculation utilities implemented
5. Money-rounding strategy used
6. How BasketContext derives its totals
7. How the Home and Basket pages share consistent values
8. Budget-status rules implemented
9. Test scenarios verified
10. TypeScript results
11. ESLint results
12. Unit-test results
13. Production-build result
14. Any known limitations

Do NOT start Phase 7 automatically.

Stop after Phase 6 is complete.
