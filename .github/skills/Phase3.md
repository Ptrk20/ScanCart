Continue developing my existing ScanCart project.

IMPORTANT:
This project already has Phase 1 and Phase 2 implemented.
Do not recreate the project, existing pages, layouts, or components.
Review the existing codebase first and integrate Phase 3 into the current
architecture and styling.

PROJECT:
ScanCart 

TECH STACK:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router

PHASE 3 GOAL:
Implement Shopping Session and Budget functionality.

The user should be able to start a grocery shopping session by choosing
a store and setting an optional shopping budget.

Once shopping has started, the Home page should show the active session,
budget, current basket total, and remaining budget.

Do NOT implement barcode scanning, IndexedDB, shopping history, or
cloud/database functionality in this phase.


==================================================
1. SHOPPING SESSION
==================================================

Create a shopping session model.

Suggested TypeScript interface:

interface ShoppingSession {
  id: string;
  store: string;
  budget: number;
  startedAt: string;
  status: "active" | "completed";
}

Use strict TypeScript.

Generate the ID without introducing a backend dependency.

For Phase 3, the session can be stored in React state/context.

Design the implementation so persistent storage can be added in a
later phase without requiring major UI changes.


==================================================
2. START SHOPPING
==================================================

When there is no active shopping session, the Home page should show
a prominent:

"Start Shopping"

button.

When tapped, show a form or mobile-friendly modal containing:

Store Name
[                     ]

Shopping Budget
₱ [                   ]

[ Start Shopping ]


Store Name:
- Required
- Trim leading/trailing whitespace
- Show an understandable validation message when empty

Budget:
- Use a numeric input suitable for mobile
- Budget must be zero or greater
- Allow decimal monetary amounts
- Empty budget can be interpreted as no budget if this fits the
  existing architecture
- Never allow NaN values into application state


==================================================
3. START SESSION
==================================================

When the user presses "Start Shopping":

Validate the form.

If valid, create an active ShoppingSession.

Example:

{
  id: "...",
  store: "SM Supermarket",
  budget: 3000,
  startedAt: "...",
  status: "active"
}

After starting the session, update the Home screen immediately.


==================================================
4. ACTIVE SHOPPING DASHBOARD
==================================================

When a shopping session is active, display something similar to:

----------------------------------

Shopping at

SM Supermarket

----------------------------------

Budget
₱3,000.00

Basket Total
₱0.00

Remaining
₱3,000.00

----------------------------------

[ Scan Item ]

----------------------------------

Use the existing BasketWise visual design.

Do not create a completely different visual style.


==================================================
5. BUDGET CALCULATIONS
==================================================

Create reusable utility functions for budget calculations.

Do not place calculation logic directly throughout UI components.

Support:

basketTotal
remainingBudget
overBudgetAmount

Calculation:

remainingBudget = budget - basketTotal

If:

basketTotal <= budget

show the remaining amount normally.

If:

basketTotal > budget

show:

Over Budget
₱150.00

or equivalently:

Over budget by ₱150.00


==================================================
6. CURRENCY
==================================================

Use Philippine Peso as the default currency.

Create or reuse a centralized currency formatter.

Example outputs:

₱0.00
₱95.00
₱1,250.50
₱3,000.00

Use Intl.NumberFormat if appropriate.

Do not manually concatenate the peso sign throughout individual
components.


==================================================
7. SESSION STATE
==================================================

Create or extend an appropriate React Context for the active shopping
session.

Example:

context/
  ShoppingSessionContext.tsx

The context should expose functionality such as:

activeSession
startSession()
endSession()

Do not duplicate global state in several unrelated components.

Avoid unnecessary third-party state-management libraries for this
phase.


==================================================
8. END SHOPPING
==================================================

Provide an "End Shopping" action for an active session.

Do NOT immediately end the session when the button is clicked.

Show a confirmation dialog:

"End shopping session?"

Then:

Cancel
End Shopping

If confirmed:

- Clear the active shopping session
- Reset session-specific state as appropriate
- Return the Home page to the "Start Shopping" state

Shopping history will be implemented later, so do not create history
persistence in Phase 3.


==================================================
9. BUDGET UI COMPONENT
==================================================

Create a reusable component such as:

components/shopping/BudgetCard.tsx

It should display:

Budget
Basket Total
Remaining / Over Budget

Example:

┌─────────────────────────────┐
│ Your Budget                 │
│                             │
│ ₱3,000.00                   │
│                             │
│ Basket           ₱1,250.00  │
│ Remaining        ₱1,750.00  │
└─────────────────────────────┘

Keep the styling mobile-first.

When the budget is exceeded, make the warning visually noticeable
without making the entire screen unnecessarily aggressive.


==================================================
10. SHOPPING SESSION FORM
==================================================

Create a reusable component such as:

components/shopping/ShoppingSessionForm.tsx

Responsibilities:

- Store input
- Budget input
- Validation
- Start Shopping action

Keep state management separate from presentation whenever practical.


==================================================
11. RESPONSIVE DESIGN
==================================================

The primary target is a smartphone.

Optimize initially for approximately:

360px - 430px wide screens

Requirements:

- Inputs should be comfortable to tap
- Buttons should have large touch targets
- Currency values should be easy to read
- Avoid horizontal scrolling
- Cards should fit smaller displays
- Desktop should still look clean and centered


==================================================
12. ACCESSIBILITY
==================================================

Use:

- Proper form labels
- Semantic HTML
- Accessible buttons
- Keyboard-accessible controls
- Appropriate focus states
- Good color contrast
- Accessible dialog behavior for confirmation UI

Do not use clickable divs when a button is appropriate.


==================================================
13. ERROR HANDLING
==================================================

Handle at least these cases:

Empty store:
"Please enter a store name."

Negative budget:
"Budget cannot be negative."

Invalid numeric input:
"Please enter a valid budget."

Do not allow invalid values into session state.


==================================================
14. EXISTING PROJECT INTEGRATION
==================================================

Before coding:

1. Inspect the existing project structure.
2. Identify existing reusable components.
3. Identify existing currency utilities.
4. Identify existing Context/providers.
5. Reuse existing styles and components where appropriate.
6. Avoid replacing working Phase 1/Phase 2 functionality.

Only create new files when they have a clear responsibility.


==================================================
15. EXPECTED STRUCTURE
==================================================

Integrate with the existing project structure.

If equivalent files do not already exist, Phase 3 may introduce:

src/
├── components/
│   └── shopping/
│       ├── BudgetCard.tsx
│       └── ShoppingSessionForm.tsx
│
├── context/
│   └── ShoppingSessionContext.tsx
│
├── lib/
│   ├── calculations.ts
│   └── currency.ts
│
└── types/
    └── shopping.ts

Do not blindly create duplicates if equivalent files already exist.


==================================================
16. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- Barcode scanner
- QR scanner
- ZXing
- Camera access
- IndexedDB
- Supabase
- PostgreSQL
- Authentication
- Shopping history
- Product price history
- Cloud synchronization
- Product APIs

Those belong to later phases.


==================================================
17. TEST THE IMPLEMENTATION
==================================================

After implementation, verify at minimum:

Scenario 1:
Store = "SM Supermarket"
Budget = 3000
Basket = 0
Result:
Remaining = ₱3,000.00

Scenario 2:
Budget = 3000
Basket = 1250
Result:
Remaining = ₱1,750.00

Scenario 3:
Budget = 3000
Basket = 3150
Result:
Over budget by ₱150.00

Scenario 4:
Store is empty
Result:
Session must not start and a validation error appears.

Scenario 5:
Budget is negative
Result:
Session must not start and a validation error appears.

Scenario 6:
End Shopping selected but user chooses Cancel
Result:
Active session remains unchanged.

Scenario 7:
End Shopping confirmed
Result:
Active session is cleared.


==================================================
18. FINAL OUTPUT
==================================================

After completing Phase 3:

1. List all files created.
2. List all existing files modified.
3. Briefly explain each change.
4. Report any TypeScript, lint, or build errors.
5. Do not continue to Phase 4 automatically.
