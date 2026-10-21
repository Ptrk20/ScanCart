Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1, 2, 3, and 4 are already implemented.

Do not recreate the project or replace working functionality.

Before writing code:

1. Inspect the existing project structure.
2. Review ShoppingSessionContext.
3. Review BasketContext.
4. Review the temporary AddBasketItemForm from Phase 4.
5. Review existing basket and product types.
6. Review currency and calculation utilities.
7. Review existing form components and styling.
8. Reuse existing functionality whenever appropriate.
9. Remove or replace temporary Phase 4 UI only when the Phase 5
   implementation fully replaces it.

==================================================
PROJECT
==================================================

Project Name:
ScanCart 

TECH STACK:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router

CURRENT FUNCTIONALITY:

- Mobile-first application layout
- Home dashboard
- Active shopping session
- Store selection
- Shopping budget
- Basket state management
- Add, update, and remove basket items
- Basket totals and item subtotals
- Remaining-budget calculation
- Over-budget warning
- End-shopping confirmation
- Temporary manual basket-item form

==================================================
PHASE 5 GOAL
==================================================

Implement the proper Manual Product Entry workflow.

Users must be able to manually enter complete product details and add the
product to the active shopping basket.

This phase must replace or improve the temporary Phase 4 add-item form.

The manual product form must support:

- Barcode
- Product name
- Brand
- Category
- Price
- Quantity
- Store

After successful submission, the product must be added to BasketContext,
and the basket and budget totals must update automatically.

Do NOT implement camera scanning, ZXing, IndexedDB, cloud storage,
authentication, or product APIs in this phase.


==================================================
1. PRODUCT TYPE
==================================================

Create or update the Product TypeScript type.

Suggested structure:

interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  lastPrice: number;
  createdAt: string;
  updatedAt: string;
}

Requirements:

- id must uniquely identify the product
- barcode is optional for manually entered products
- name is required
- brand is optional
- category is optional
- lastPrice must be zero or greater
- createdAt and updatedAt must use a consistent date format

Use strict TypeScript.

Do not use "any" unless absolutely necessary.


==================================================
2. MANUAL PRODUCT FORM
==================================================

Create or update:

src/components/product/ProductForm.tsx

The form must contain:

Barcode
Product Name
Brand
Category
Price
Quantity
Store

Example:

Barcode
[ 4801234567890 ]

Product Name
[ Fresh Milk ]

Brand
[ Example Brand ]

Category
[ Dairy ]

Price
₱ [ 95.00 ]

Quantity
[ − ] 1 [ + ]

Store
[ SM Supermarket ]

[ Save & Add to Basket ]

[ Cancel ]


==================================================
3. FORM FIELD RULES
==================================================

BARCODE

- Optional for manual product entry
- Treat the barcode as a string, not a number
- Preserve leading zeros
- Trim leading and trailing whitespace
- Do not convert it using Number() or parseInt()
- Allow common retail barcode lengths
- Do not enforce a specific barcode standard yet

PRODUCT NAME

- Required
- Trim leading and trailing whitespace
- Must not contain only spaces
- Display a clear validation message when empty

BRAND

- Optional
- Trim leading and trailing whitespace

CATEGORY

- Optional
- Allow category selection
- Provide a reasonable default list
- Include an "Other" option

Suggested categories:

- Bakery
- Beverages
- Canned Goods
- Dairy
- Frozen Food
- Fruits
- Household
- Meat
- Personal Care
- Snacks
- Vegetables
- Other

Do not prevent future custom categories.

PRICE

- Required
- Must be a valid numeric value
- Must be zero or greater
- Allow decimal amounts
- Do not allow NaN or Infinity
- Format for Philippine Peso in the UI
- Store as a number in application state

QUANTITY

- Required
- Default value is 1
- Must be a whole number
- Must be at least 1
- Must not be a decimal
- Must not be NaN or Infinity

STORE

- Auto-fill from the active ShoppingSession
- If an active session has store "SM Supermarket," display that store
- The store field can be read-only during an active session
- Do not duplicate store state unnecessarily inside the product form


==================================================
4. FORM VALIDATION
==================================================

Create or reuse centralized validation utilities.

Possible location:

src/lib/validation.ts

Implement reusable validation functions when appropriate.

Validation messages should be understandable.

Examples:

Empty product name:

"Please enter a product name."

Empty price:

"Please enter the product price."

Invalid price:

"Please enter a valid price."

Negative price:

"Price cannot be negative."

Invalid quantity:

"Please enter a valid quantity."

Quantity below 1:

"Quantity must be at least 1."

Do not submit the form when validation fails.

Display field-level validation close to the related input.

When the user corrects an invalid field, update or clear its error
without requiring a page refresh.


==================================================
5. MANUAL PRODUCT PAGE
==================================================

Create a dedicated route for adding a product manually.

Suggested route:

src/app/products/new/page.tsx

URL:

/products/new

The page should display:

- Back navigation
- Page title
- Short explanation
- Product form
- Save & Add to Basket button
- Cancel button

Example:

--------------------------------

Add Product

Enter the product details and its
current store price.

[ Product Form ]

[ Save & Add to Basket ]

[ Cancel ]

--------------------------------


==================================================
6. ACCESS FROM HOME
==================================================

Add an easily accessible action on the Home page:

[ Scan Barcode ]

[ Add Item Manually ]

The scanner action can remain disabled, marked as coming later, or link
to an existing placeholder scanner page.

The manual action must navigate to:

/products/new

Do not implement camera scanning in this phase.


==================================================
7. ACCESS FROM BASKET
==================================================

Update the Basket page's empty state.

Example:

Your basket is empty.

Add your first product to start tracking your shopping total.

[ Add Item Manually ]

The button must navigate to:

/products/new

When the basket already contains items, also provide an accessible action
such as:

[ + Add Another Item ]


==================================================
8. ADD PRODUCT TO BASKET
==================================================

When the form is submitted successfully:

1. Normalize and validate the form data.
2. Create a product object.
3. Create a compatible BasketItem.
4. Call BasketContext.addItem().
5. Update the basket total automatically.
6. Update the remaining budget automatically.
7. Navigate the user to the Basket page.
8. Display success feedback.

Example input:

Product Name:
Fresh Milk

Barcode:
4801234567890

Brand:
Example Brand

Category:
Dairy

Price:
95

Quantity:
2

Expected basket item:

{
  id: "...",
  productId: "...",
  barcode: "4801234567890",
  name: "Fresh Milk",
  price: 95,
  quantity: 2
}

Expected subtotal:

₱190.00


==================================================
9. PRODUCT AND BASKET SEPARATION
==================================================

Maintain a clear distinction between Product and BasketItem.

Product represents descriptive product information.

BasketItem represents a product added to the current shopping basket.

Example:

Product:

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

BasketItem:

{
  id: "basket-item-456",
  productId: "product-123",
  barcode: "4801234567890",
  name: "Fresh Milk",
  price: 95,
  quantity: 2
}

Do not place basket-specific values such as quantity inside the core
Product type.


==================================================
10. DUPLICATE PRODUCT HANDLING
==================================================

BasketContext may already merge duplicate products from Phase 4.

Preserve or improve that behavior.

When a manually entered product has a barcode and another basket item
already has the same barcode:

- Treat it as the same product.
- Increase the existing quantity.
- Do not create a duplicate basket row.
- If the newly entered price differs, use a predictable policy.

For Phase 5, use this price policy:

- Update the existing basket item's price to the newly entered price.
- Add the newly entered quantity to the existing quantity.

Example:

Existing item:

Fresh Milk
Barcode: 4801234567890
Price: ₱95
Quantity: 1

New manual entry:

Fresh Milk
Barcode: 4801234567890
Price: ₱99
Quantity: 2

Expected result:

Fresh Milk
Price: ₱99
Quantity: 3
Subtotal: ₱297

If neither product has a barcode, do not merge products based only on
similar names unless the current architecture already has a reliable
product ID.


==================================================
11. ACTIVE SESSION REQUIREMENT
==================================================

A user should normally have an active shopping session before adding a
product.

If the user navigates directly to:

/products/new

without an active shopping session, do not silently create a session.

Show a useful message:

"Start a shopping session before adding products."

Provide an action:

[ Start Shopping ]

Navigate the user to the appropriate Home page or shopping-session form.

Do not allow products to be added to a nonexistent session.


==================================================
12. CURRENT STORE
==================================================

Get the store from ShoppingSessionContext.

Example:

activeSession.store

If the active session store is:

SM Supermarket

the product form should show:

Store
SM Supermarket

Do not make the user type the store again.

Do not keep an unrelated duplicate copy of the store name in local form
state unless technically necessary.


==================================================
13. SUCCESS FEEDBACK
==================================================

After adding a product, provide immediate feedback.

Example:

"Fresh Milk was added to your basket."

The message should be accessible and visible.

Avoid blocking browser alert() if the existing project already has a
toast, status message, or notification pattern.

After successful submission, navigate to:

/basket

Do not leave the user on a completed form with stale input values.


==================================================
14. CANCEL BEHAVIOR
==================================================

The Cancel button must not add anything to the basket.

A reasonable behavior is:

- Return to the previous page when possible, or
- Navigate to /basket

Do not clear or modify the existing basket when Cancel is selected.

If the form contains entered data, use the simplest behavior consistent
with the existing project.

Do not implement a complex unsaved-changes system unless one already
exists.


==================================================
15. FORM SUBMISSION SAFETY
==================================================

Prevent accidental duplicate submissions.

When the form is being submitted:

- Disable the submit button briefly while processing
- Show a submitting state such as "Adding..."
- Ensure rapid repeated clicks do not add duplicate basket entries

Because this phase uses client state only, keep the implementation simple
and predictable.


==================================================
16. FORM RESET
==================================================

After successful submission:

- Reset local form state
- Clear validation errors
- Do not clear the rest of the basket
- Do not clear the active shopping session
- Navigate to /basket


==================================================
17. CLIENT COMPONENT BOUNDARIES
==================================================

Use "use client" only where required.

Components using:

- React state
- Context
- Event handlers
- Router navigation
- Browser APIs

must be Client Components.

Keep static layout and presentation as Server Components where practical.

Avoid creating unnecessary hydration boundaries.


==================================================
18. MOBILE-FIRST UI
==================================================

ScanCart is designed primarily for smartphones.

Optimize the product form for approximately:

360px to 430px wide screens.

Requirements:

- Inputs must fill the available width
- Form labels must remain visible
- Buttons must be comfortable to tap
- Numeric fields should open a suitable mobile keyboard
- Avoid horizontal scrolling
- Keep primary action easy to reach
- Maintain consistent spacing
- Keep error messages readable

Use appropriate input modes.

For price:

inputMode="decimal"

For quantity:

inputMode="numeric"

For barcode:

inputMode="numeric"

Remember that barcode values must still be stored as strings.


==================================================
19. ACCESSIBILITY
==================================================

Use:

- Semantic form elements
- Proper label and input associations
- Accessible field-level errors
- aria-invalid when a field has an error
- aria-describedby for validation messages
- Visible keyboard focus states
- Accessible buttons
- Sufficient color contrast

Do not rely only on placeholder text as a label.

Do not implement clickable div elements when button or link elements are
appropriate.


==================================================
20. REUSABLE COMPONENTS
==================================================

Possible component structure:

src/components/product/

ProductForm.tsx
CategorySelect.tsx
PriceInput.tsx
ProductFormField.tsx

Do not create excessive abstraction for simple fields.

Create a component only when it has a clear responsibility or useful
reuse.


==================================================
21. VALIDATION UTILITIES
==================================================

Update or create:

src/lib/validation.ts

Possible reusable functions:

validateProductName(name)

validatePrice(price)

validateQuantity(quantity)

normalizeBarcode(barcode)

All functions should return predictable results and avoid throwing errors
for ordinary invalid form input.


==================================================
22. TYPE ORGANIZATION
==================================================

Possible files:

src/types/product.ts
src/types/basket.ts

Product form values may have a separate type because input values may be
strings before validation.

Example:

interface ProductFormValues {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  quantity: string;
}

After validation, convert to properly typed domain values.

Do not mix unvalidated string form input directly into Product or
BasketItem state.


==================================================
23. TEMPORARY PHASE 4 FORM
==================================================

Phase 4 included a temporary AddBasketItemForm.

Review it before making changes.

If ProductForm completely replaces it:

- Remove the temporary component if nothing uses it.
- Update affected imports.
- Update links and buttons to use /products/new.
- Do not leave dead code.
- Do not leave duplicate add-item experiences unless both have clear
  purposes.

If useful logic exists in the temporary form, migrate that logic rather
than discarding it blindly.


==================================================
24. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- Barcode camera scanner
- QR camera scanner
- Camera permissions
- ZXing
- IndexedDB
- Local product database
- Persistent shopping sessions
- Persistent basket data
- Supabase
- PostgreSQL
- Authentication
- Product information APIs
- Cloud synchronization
- Shopping history
- Price history
- PWA installation
- Service workers

Those belong to later phases.


==================================================
25. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing project.

The project may approximately contain:

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
│   └── product/
│       ├── ProductForm.tsx
│       └── CategorySelect.tsx
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

Do not create duplicate files when equivalent functionality already
exists.


==================================================
26. TEST SCENARIOS
==================================================

Verify at minimum:

TEST 1: VALID PRODUCT

Active session:

Store:
SM Supermarket

Budget:
₱3,000

Input:

Barcode:
4801234567890

Product:
Fresh Milk

Brand:
Example Brand

Category:
Dairy

Price:
95

Quantity:
2

Expected:

Product is added to the basket.
Subtotal is ₱190.00.
Basket total is ₱190.00.
Remaining budget is ₱2,810.00.


TEST 2: PRODUCT WITHOUT BARCODE

Input:

Barcode:
blank

Product:
Bread

Price:
75

Quantity:
1

Expected:

Product is added successfully.
Barcode remains optional.


TEST 3: EMPTY PRODUCT NAME

Input:

Product:
blank

Expected:

Form is not submitted.
Display:

"Please enter a product name."


TEST 4: NEGATIVE PRICE

Input:

Price:
-95

Expected:

Form is not submitted.
Display:

"Price cannot be negative."


TEST 5: INVALID PRICE

Input:

Price:
abc

Expected:

Form is not submitted.
Display:

"Please enter a valid price."


TEST 6: ZERO QUANTITY

Input:

Quantity:
0

Expected:

Form is not submitted.
Display:

"Quantity must be at least 1."


TEST 7: DECIMAL QUANTITY

Input:

Quantity:
1.5

Expected:

Form is not submitted.
Quantity must be a whole number.


TEST 8: CANCEL

Enter valid form data and select Cancel.

Expected:

No item is added.
Existing basket remains unchanged.


TEST 9: DUPLICATE BARCODE

Existing basket:

Fresh Milk
Barcode: 4801234567890
Price: ₱95
Quantity: 1

New entry:

Fresh Milk
Barcode: 4801234567890
Price: ₱99
Quantity: 2

Expected:

One Fresh Milk row remains.
Price becomes ₱99.
Quantity becomes 3.
Subtotal becomes ₱297.


TEST 10: LEADING ZERO BARCODE

Input barcode:

0123456789012

Expected:

Barcode remains:

0123456789012

It must not become:

123456789012


TEST 11: NO ACTIVE SESSION

Navigate directly to:

/products/new

Expected:

Display a message requiring the user to start a shopping session.
Do not allow product submission.


TEST 12: RAPID SUBMISSION

Press Save & Add to Basket repeatedly.

Expected:

Only one submission is processed for that form action.


==================================================
27. QUALITY CHECKS
==================================================

After implementation, run the existing project checks.

Verify:

- TypeScript has no new errors
- ESLint has no new errors
- The production build completes
- Imports are valid
- Routes work
- No hydration errors occur
- No duplicate Context providers exist
- No dead Phase 4 form code remains
- Mobile layout does not horizontally overflow
- Existing Phase 1–4 functionality still works

Fix all issues introduced by Phase 5 before considering it complete.


==================================================
28. FINAL RESPONSE
==================================================

After completing Phase 5, report:

1. Files created
2. Files modified
3. Files removed
4. Manual product entry functionality implemented
5. Validation rules implemented
6. How Product is converted into BasketItem
7. How duplicate barcodes are handled
8. Test scenarios verified
9. TypeScript, lint, and build results
10. Any known limitations

Do NOT start Phase 6 automatically.

Stop after Phase 5 is complete.
