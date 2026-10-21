Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1, 2, and 3 are already implemented.

Do NOT recreate the project or replace working functionality.

Before making changes:
1. Inspect the existing project structure.
2. Review the existing ShoppingSessionContext.
3. Review existing TypeScript types.
4. Review currency.ts and calculations.ts.
5. Review the existing Home and Basket pages.
6. Reuse existing components and styling wherever possible.

==================================================
PROJECT
==================================================

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
- Shopping session
- Store selection
- Shopping budget
- Active shopping session
- Budget display
- Currency formatting
- End-shopping confirmation

==================================================
PHASE 4 GOAL
==================================================

Implement Basket State Management.

The user must be able to:

- Add items to the current basket
- Increase item quantity
- Decrease item quantity
- Remove items
- Edit item prices
- View item subtotals
- View the basket total
- See remaining budget automatically update
- See an over-budget warning

For this phase, products can be added manually or using temporary test
data as needed for development.

Do NOT implement barcode scanning or IndexedDB yet.


==================================================
1. BASKET ITEM TYPE
==================================================

Create or update the BasketItem TypeScript interface.

Suggested structure:

interface BasketItem {
  id: string;
  productId?: string;
  barcode?: string;
  name: string;
  price: number;
  quantity: number;
}

Requirements:

- id must uniquely identify the basket entry
- name is required
- price must be >= 0
- quantity must be >= 1

Do NOT store subtotal as state.

Calculate subtotal dynamically:

subtotal = price * quantity


==================================================
2. BASKET CONTEXT
==================================================

Create:

src/context/BasketContext.tsx

Or extend an existing basket state solution if one already exists.

The BasketContext should manage:

items

and expose operations similar to:

addItem()
removeItem()
increaseQuantity()
decreaseQuantity()
updateQuantity()
updatePrice()
clearBasket()

It should also expose calculated values such as:

itemCount
basketTotal

Avoid duplicating calculation logic in page components.


==================================================
3. ADD ITEM
==================================================

Implement:

addItem(item)

When adding a completely new item:

Add it to the basket with quantity >= 1.

Example:

{
  id: "...",
  name: "Fresh Milk",
  barcode: "4801234567890",
  price: 95,
  quantity: 1
}

If the same product is added again, prefer increasing its quantity rather
than creating duplicate basket rows when the existing data allows the
product to be reliably identified.

The implementation should be designed so barcode-based matching can be
added cleanly in Phase 8.


==================================================
4. QUANTITY MANAGEMENT
==================================================

Users must be able to increase quantity.

Example:

Fresh Milk

[-]  1  [+]

Pressing +:

1 -> 2 -> 3 -> 4

Subtotal must automatically update.

Example:

₱95.00 x 1 = ₱95.00
₱95.00 x 2 = ₱190.00


==================================================
5. DECREASE QUANTITY
==================================================

Pressing "-" should decrease quantity.

Example:

3 -> 2 -> 1

Quantity must NEVER become:

0
-1
-2

If quantity is already 1, do not decrement below 1.

The user should use the remove action to completely remove an item.


==================================================
6. REMOVE ITEM
==================================================

Provide a Remove action for every basket item.

Example:

Fresh Milk
₱95.00 x 2

[-] 2 [+]

Remove

When removed:

- Delete the item from basket state.
- Recalculate item count.
- Recalculate basket total.
- Recalculate remaining budget.

For this phase, a simple accessible confirmation can be used before
removing the item if consistent with the existing UX.


==================================================
7. EDIT PRICE
==================================================

Allow the user to modify the current basket price.

Example:

Fresh Milk

Current price:
₱95.00

Edit Price

New price:
₱99.00

Save

After saving:

- Update the item's price.
- Recalculate subtotal.
- Recalculate basket total.
- Recalculate remaining budget.

Validate the price.

Price cannot:

- Be negative
- Be NaN
- Be an invalid numeric value


==================================================
8. ITEM SUBTOTAL
==================================================

Each basket item must show its subtotal.

Calculation:

subtotal = price * quantity

Example:

Fresh Milk

₱95.00 × 2

Subtotal
₱190.00

Use the existing currency formatting utility.

Do not manually build strings such as:

"₱" + price


==================================================
9. BASKET TOTAL
==================================================

Create or reuse a calculation utility.

basketTotal = sum(price * quantity)

Example:

Milk
₱95 × 2
= ₱190

Bread
₱75 × 1
= ₱75

Coke
₱65 × 2
= ₱130

Basket Total:

₱395.00

Do not manually maintain basketTotal as separate mutable state if it
can be reliably derived from basket items.


==================================================
10. ITEM COUNT
==================================================

Calculate the total number of physical items in the basket.

Example:

Milk
Quantity 2

Bread
Quantity 1

Coke
Quantity 3

Item count:

6

Do NOT simply use:

items.length

because that would return only 3 product rows.

Instead calculate:

sum(item.quantity)


==================================================
11. BASKET PAGE
==================================================

Update or create:

src/app/basket/page.tsx

Display:

- Current store
- Basket items
- Item quantity
- Individual price
- Item subtotal
- Quantity controls
- Edit price
- Remove action
- Total number of items
- Basket total
- Remaining budget

Example mobile layout:

--------------------------------

Your Basket

SM Supermarket

3 Products | 6 Items

--------------------------------

Fresh Milk

₱95.00 each

[-] 2 [+]

Subtotal
₱190.00

Edit Price     Remove

--------------------------------

Bread

₱75.00 each

[-] 1 [+]

Subtotal
₱75.00

Edit Price     Remove

--------------------------------

Basket Total

₱265.00

Budget
₱3,000.00

Remaining
₱2,735.00

--------------------------------


==================================================
12. EMPTY BASKET
==================================================

When there are no basket items, display a useful empty state.

Example:

Your basket is empty.

Add your first item to start tracking your shopping total.

[ Add Item ]

Do not show a blank page.


==================================================
13. CONNECT BASKET TO PHASE 3 BUDGET
==================================================

This is one of the most important Phase 4 requirements.

The Phase 3 budget currently has a basket total.

Replace any temporary/hard-coded basket total with the REAL calculated
BasketContext total.

Example:

Shopping Budget:
₱3,000.00

Basket Total:
₱1,250.00

Remaining:
₱1,750.00

Calculation:

remainingBudget = sessionBudget - basketTotal

The Home page and Basket page must use the same calculated basket total.


==================================================
14. OVER-BUDGET STATE
==================================================

If:

basketTotal > budget

change the budget summary from:

Remaining

to:

Over Budget

Example:

Budget:
₱3,000

Basket:
₱3,150

Over Budget:
₱150

Use:

overBudgetAmount = basketTotal - budget

Make the warning noticeable.

Use an accessible warning color/style.

Do not rely only on color to communicate that the budget was exceeded.


==================================================
15. END SHOPPING INTEGRATION
==================================================

Phase 3 already supports ending a shopping session.

When the user confirms:

End Shopping

Phase 4 should also clear the current basket.

Expected behavior:

endSession()
clearBasket()

Do NOT clear the basket when the user selects Cancel.

Example:

User clicks End Shopping
        ↓
Confirmation
        ↓
   Cancel / End
      │       │
      │       └── clear session
      │           clear basket
      │
      └── keep everything


==================================================
16. TEMPORARY MANUAL ITEM ENTRY
==================================================

Barcode scanning is NOT implemented yet.

Provide a simple mechanism for testing basket functionality.

For example:

[ + Add Item ]

Form:

Product Name
[ Fresh Milk ]

Price
[ 95.00 ]

Quantity
[ 1 ]

[ Add to Basket ]

This can later be reused or adapted for Phase 5 Manual Product Entry.

Do not over-engineer this form because Phase 5 will implement the full
manual product workflow.


==================================================
17. BASKET COMPONENTS
==================================================

Prefer small reusable components.

Possible structure:

src/components/basket/

BasketItem.tsx
BasketSummary.tsx
QuantityControl.tsx
AddBasketItemForm.tsx

Responsibilities:


BasketItem.tsx

Display:

- Name
- Price
- Quantity
- Subtotal
- Actions


QuantityControl.tsx

Handles:

[-] quantity [+]


BasketSummary.tsx

Displays:

Products
Items
Basket Total
Budget
Remaining / Over Budget


AddBasketItemForm.tsx

Temporary Phase 4 testing UI for manually adding items.


==================================================
18. CALCULATION UTILITIES
==================================================

Update:

src/lib/calculations.ts

as needed.

Prefer reusable pure functions such as:

calculateItemSubtotal(item)

calculateBasketTotal(items)

calculateBasketItemCount(items)

calculateRemainingBudget(budget, basketTotal)

calculateOverBudget(budget, basketTotal)

Do not duplicate formulas across components.


==================================================
19. PERFORMANCE
==================================================

Avoid unnecessary state duplication.

Values such as:

basketTotal
itemCount
subtotal

should generally be derived from basket state.

Use React hooks appropriately.

Do not introduce Redux or another large state-management library.


==================================================
20. MOBILE UX
==================================================

BasketWise is mobile-first.

Optimize for approximately:

360px - 430px wide smartphones.

Quantity controls must be easy to tap.

Bad:

- 1 +

Better:

[ − ]    2    [ + ]

Buttons must have adequate touch areas.

Important price information should be visually prominent.

Avoid horizontal scrolling.


==================================================
21. ACCESSIBILITY
==================================================

Provide accessible names for quantity buttons.

For example:

Increase quantity of Fresh Milk
Decrease quantity of Fresh Milk

Remove buttons should indicate which product is being removed.

Use:

button

rather than clickable div elements.

Maintain keyboard accessibility and visible focus states.


==================================================
22. VALIDATION
==================================================

Test and handle:

Empty product name

Price < 0

Invalid price

Quantity = 0

Quantity < 0

Invalid quantity

NaN values

Empty basket

Attempt to decrement quantity below 1

Ensure invalid values never enter BasketContext state.


==================================================
23. STATE CONSISTENCY
==================================================

There must be ONE source of truth for basket data.

The following screens should reflect the SAME basket:

Home
Basket
Budget Card

Example:

If Basket page shows:

₱1,250

Home page must also show:

₱1,250

Do not keep independent basket states on separate pages.


==================================================
24. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- Barcode scanner
- QR scanner
- Camera
- ZXing
- IndexedDB
- Local database persistence
- Supabase
- PostgreSQL
- Authentication
- Product API
- Shopping history
- Price history
- Cloud synchronization
- PWA features

These belong to later phases.


==================================================
25. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing architecture.

The project may now approximately contain:

src/
│
├── app/
│   ├── page.tsx
│   └── basket/
│       └── page.tsx
│
├── components/
│   ├── basket/
│   │   ├── BasketItem.tsx
│   │   ├── BasketSummary.tsx
│   │   ├── QuantityControl.tsx
│   │   └── AddBasketItemForm.tsx
│   │
│   └── shopping/
│       ├── BudgetCard.tsx
│       └── ShoppingSessionForm.tsx
│
├── context/
│   ├── ShoppingSessionContext.tsx
│   └── BasketContext.tsx
│
├── lib/
│   ├── calculations.ts
│   └── currency.ts
│
└── types/
    ├── shopping.ts
    └── basket.ts

Do NOT create duplicate files if equivalent functionality already exists.


==================================================
26. TEST SCENARIOS
==================================================

Verify at minimum:

TEST 1

Budget:
₱3,000

Add:
Milk
Price: ₱95
Quantity: 1

Expected:

Basket Total = ₱95
Remaining = ₱2,905


TEST 2

Increase Milk quantity:

1 -> 2

Expected:

Subtotal = ₱190
Basket Total = ₱190
Remaining = ₱2,810


TEST 3

Add:

Bread
₱75
Quantity 2

Expected:

Milk:
₱190

Bread:
₱150

Basket Total:
₱340

Item Count:
4


TEST 4

Decrease Bread:

2 -> 1

Expected:

Basket Total:
₱265

Item Count:
3


TEST 5

Try decreasing quantity from 1.

Expected:

Quantity remains 1.


TEST 6

Change Milk price:

₱95 -> ₱100

Milk quantity:
2

Expected:

Milk subtotal:
₱200


TEST 7

Remove Bread.

Expected:

Bread disappears from basket.

Totals update immediately.


TEST 8

Budget:
₱300

Basket:
₱350

Expected:

Over Budget:
₱50


TEST 9

End Shopping -> Cancel

Expected:

Session remains active.
Basket remains unchanged.


TEST 10

End Shopping -> Confirm

Expected:

Session cleared.
Basket cleared.


==================================================
27. QUALITY CHECK
==================================================

After implementation:

Run the appropriate existing project checks.

Check for:

- TypeScript errors
- ESLint errors
- React warnings
- Invalid imports
- Broken routes
- Duplicate contexts
- Hydration issues
- Incorrect server/client component usage

Fix errors caused by Phase 4 before considering the phase complete.


==================================================
28. FINAL RESPONSE
==================================================

After completing Phase 4, report:

1. Files created
2. Files modified
3. Basket functionality implemented
4. How BasketContext works
5. How basket totals connect to the Phase 3 budget
6. Test scenarios verified
7. Any remaining TypeScript/lint/build errors

Do NOT start Phase 5 automatically.

Stop after Phase 4 is complete.
