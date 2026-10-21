Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 7 are already implemented.

Do not recreate the project.
Do not rename ScanCart.
Do not replace working functionality.
Do not start Phase 9.

Before writing code:

1. Inspect the existing project structure.
2. Review package.json and installed dependencies.
3. Review ShoppingSessionContext.
4. Review BasketContext.
5. Review the IndexedDB database and repository layer.
6. Review getProductByBarcode() or its equivalent.
7. Review the Product and BasketItem types.
8. Review barcode normalization and validation utilities.
9. Review the manual product-entry route.
10. Review the existing scan page or placeholder, if present.
11. Preserve all working functionality from Phases 1 through 7.

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
- idb, if already selected in Phase 7
- ZXing browser library for barcode and QR scanning

CURRENT FUNCTIONALITY:

- Mobile-first interface
- Shopping sessions
- Store and budget tracking
- Basket state management
- Manual product entry
- Centralized calculations
- IndexedDB product persistence
- IndexedDB basket persistence
- Active-session persistence
- Product lookup by barcode
- Price-record persistence
- Existing-product updates

==================================================
PHASE 8 GOAL
==================================================

Implement barcode and QR-code scanning using the phone's camera.

The user must be able to:

- Open the scanner from ScanCart
- Grant camera permission
- Scan a product barcode or QR code
- Stop duplicate detections
- Look up the scanned code in IndexedDB
- View an existing product when found
- Enter details for an unknown product
- Confirm or update the current store price
- Add the product to the basket
- Scan another item
- Enter the barcode manually when camera scanning is unavailable

Primary target:

Mobile browsers on Android and iPhone.

Desktop browsers should remain usable, especially through manual code
entry, but mobile camera scanning is the primary experience.

==================================================
1. SCANNING LIBRARY
==================================================

Inspect package.json first.

If a compatible scanner library is not already installed, use:

@zxing/browser

Do not install multiple barcode-scanning libraries.

Do not use both ZXing and html5-qrcode unless the existing project
already depends on one and replacing it would cause regressions.

Use only documented public APIs from the installed library version.

Ensure all scanner code is strongly typed.

==================================================
2. SUPPORTED CODE FORMATS
==================================================

Support common grocery and retail formats when the selected library and
device support them.

Important formats include:

- EAN-13
- EAN-8
- UPC-A
- UPC-E
- Code 128
- Code 39
- ITF
- QR Code

Do not assume every browser/device supports every format equally.

The scanner should use a practical set of formats rather than scanning
for unnecessary formats when the library allows configuration.

Do not transform the detected value into a number.

All detected codes must remain strings.

==================================================
3. SCANNER ROUTE
==================================================

Create or update:

src/app/scan/page.tsx

URL:

/scan

The page should contain:

- Back navigation
- ScanCart branding or existing page header
- Page title
- Camera scanner area
- Scanning instructions
- Camera status
- Start Camera action
- Stop Camera action
- Manual barcode-entry fallback
- Accessible error messages

Example:

--------------------------------

Scan an Item

Position the product barcode
inside the scanning area.

┌──────────────────────────┐
│                          │
│       CAMERA VIEW        │
│                          │
│   ───────────────────    │
│        BARCODE           │
│   ───────────────────    │
│                          │
└──────────────────────────┘

[ Stop Camera ]

Can't scan the barcode?

[ Enter Code Manually ]

--------------------------------

==================================================
4. ACTIVE SESSION REQUIREMENT
==================================================

A user must normally have an active shopping session before scanning.

If the user visits:

/scan

without an active session, do not start the camera automatically.

Display:

"Start a shopping session before scanning products."

Provide:

[ Start Shopping ]

Navigate to the Home page or existing session-start workflow.

Do not silently create a shopping session.

==================================================
5. SCANNER COMPONENT
==================================================

Create a reusable scanner component.

Suggested file:

src/components/scanner/BarcodeScanner.tsx

Responsibilities:

- Request camera access
- Attach camera stream to a video element
- Start scanning
- Stop scanning
- Detect supported barcode/QR formats
- Emit one normalized scan result
- Handle scanning errors
- Clean up camera resources
- Display scanner state

Suggested component contract:

interface BarcodeScannerProps {
  onDetected: (value: string, format?: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

Names may be adjusted to match existing project conventions.

Do not include IndexedDB product lookup directly inside the low-level
camera component.

Keep scanning and product lookup as separate responsibilities.

==================================================
6. CAMERA PERMISSION
==================================================

Request camera access only after:

- The user intentionally opens the scanner page, or
- The user presses Start Camera

Do not request camera access globally when ScanCart loads.

Prefer the rear-facing camera when supported.

Use an appropriate video constraint such as:

facingMode: "environment"

Treat it as a preference, not a guarantee.

Handle these cases:

- Permission granted
- Permission denied
- Camera unavailable
- No compatible camera found
- Browser does not support camera access
- Camera already in use
- Camera stream interrupted

Provide user-friendly messages.

Do not expose raw browser exceptions directly to the user.

==================================================
7. SECURE-CONTEXT REQUIREMENT
==================================================

Camera access generally requires an appropriate secure browser context.

Handle camera access failure without crashing ScanCart.

Provide a useful message such as:

"Camera access is unavailable. Check your browser permission or enter
the barcode manually."

Do not assume camera access will work from every development URL,
embedded browser, or device.

Always preserve manual entry as a fallback.

==================================================
8. SCANNER LIFECYCLE
==================================================

The scanner must release camera resources when:

- The user stops scanning
- A barcode is accepted
- The user navigates away
- The scanner component unmounts
- The page becomes inactive when appropriate
- An unrecoverable camera error occurs

Stop:

- ZXing controls
- MediaStream tracks
- Scan callbacks
- Any timers created by the scanner

The camera indicator on the phone should turn off after scanning stops.

Avoid memory leaks and duplicate camera streams.

==================================================
9. DUPLICATE SCAN PREVENTION
==================================================

Camera scanners may detect the same barcode many times per second.

Implement a scan lock or equivalent guard.

Expected behavior:

First valid detection
        ↓
Lock scanner
        ↓
Stop or pause detection
        ↓
Process barcode once
        ↓
Navigate to product result

Do not add the same item repeatedly because the camera continued to see
the barcode.

Prevent duplicate processing caused by:

- Repeated ZXing callbacks
- React re-renders
- Rapid camera detections
- Multiple navigation calls
- Double-clicking confirmation buttons

==================================================
10. CODE NORMALIZATION
==================================================

Reuse the Phase 5/Phase 7 barcode normalization utility.

Example:

normalizeBarcode(" 0123456789012 ")

returns:

"0123456789012"

Requirements:

- Trim surrounding whitespace
- Keep the value as a string
- Preserve leading zeros
- Do not use Number()
- Do not use parseInt()
- Do not invent missing digits
- Do not remove valid characters from QR content

Be careful that QR codes may contain text or URLs rather than only
numeric retail barcodes.

==================================================
11. BARCODE AND QR DISTINCTION
==================================================

Treat barcode and QR results carefully.

For retail barcodes:

- Use the scanned text as the product lookup key.

For QR codes:

- The QR result may contain a product identifier, URL, or arbitrary text.
- Do not automatically open scanned URLs.
- Do not automatically navigate to an external website.
- Do not execute or render QR content as HTML.
- Treat QR contents as untrusted plain text.
- Use the value for product lookup only when suitable.
- Otherwise show the scanned value and allow the user to continue
  manually or cancel.

Do not assume every QR code represents a ScanCart product.

==================================================
12. SCAN RESULT FLOW
==================================================

After a code is detected:

1. Normalize the scanned value.
2. Lock scanning.
3. Stop the camera.
4. Query IndexedDB using getProductByBarcode().
5. Show a loading state during lookup.
6. If the product exists, show the existing-product flow.
7. If the product does not exist, open the new-product flow.
8. Preserve the scanned code exactly as normalized.

Expected flow:

Camera
   ↓
Detected code
   ↓
Normalize
   ↓
Stop repeated scans
   ↓
IndexedDB lookup
   ↓
┌───────────────┴──────────────┐
│                              │
Product found              Product not found
│                              │
Confirm product            Product form
and current price          pre-filled barcode
│                              │
└───────────────┬──────────────┘
                ↓
          Add to basket

==================================================
13. PRODUCT LOOKUP
==================================================

Use the Phase 7 product repository.

Expected repository operation:

getProductByBarcode(barcode)

Do not query IndexedDB directly from JSX.

Do not duplicate the product-lookup implementation in the scanner page.

Create or reuse a clean lookup service/hook if necessary.

Handle:

- Product found
- Product not found
- Database still loading
- Database lookup failure

==================================================
14. KNOWN PRODUCT FLOW
==================================================

When a scanned barcode matches an existing Product, show:

- Product name
- Brand, when available
- Category, when available
- Barcode
- Last recorded price
- Current store
- Current price input
- Quantity control
- Add to Basket action
- Scan Again action
- Cancel action

Example:

--------------------------------

Product Found

Fresh Milk

Example Brand
Dairy

Barcode
4801234567890

Last Recorded Price
₱95.00

Current Price
₱ [ 99.00 ]

Quantity
[ − ] 1 [ + ]

Store
SM Supermarket

[ Add to Basket ]

[ Scan Again ]

--------------------------------

Do not assume the last recorded price is still correct.

The user must be able to confirm or change the current price.

==================================================
15. CURRENT PRICE REQUIREMENT
==================================================

A retail barcode usually identifies a product, not the current store
price.

Do not automatically treat the stored last price as guaranteed current.

Pre-fill the current-price field with lastPrice when available, but make
it editable.

Validate:

- Price is required
- Price must be finite
- Price must be zero or greater
- Decimal prices are allowed
- NaN and Infinity are rejected

Use the existing ScanCart price validation utilities.

==================================================
16. KNOWN PRODUCT CONFIRMATION COMPONENT
==================================================

Create a focused component if useful.

Suggested file:

src/components/scanner/ScannedProductResult.tsx

Responsibilities:

- Display existing product information
- Accept current price
- Accept quantity
- Confirm Add to Basket
- Show validation errors
- Prevent duplicate submission

Do not put camera-control logic inside this component.

==================================================
17. UNKNOWN PRODUCT FLOW
==================================================

When the scanned code is not found:

Navigate to or display the existing manual product form with the barcode
pre-filled.

Preferred route pattern:

/products/new?barcode=4801234567890

or use another clean existing routing/state approach.

Requirements:

- Barcode is pre-filled
- Barcode remains editable only if appropriate
- Product name remains required
- Brand remains optional
- Category remains optional
- Price remains required
- Quantity defaults to 1
- Store comes from the active session
- Save and Add to Basket uses the Phase 5 and Phase 7 workflow

Do not create a second unrelated product-entry form.

Reuse ProductForm.

==================================================
18. INVALID OR EMPTY SCAN
==================================================

If the scanner returns:

- Empty text
- Whitespace-only text
- Invalid result object
- Unsupported result

Do not navigate or perform a product lookup.

Continue scanning or show a recoverable message.

Do not add invalid barcode values to IndexedDB.

==================================================
19. MANUAL CODE ENTRY
==================================================

Provide a fallback form on the Scan page.

Fields:

Barcode or Code
[                       ]

Action:

[ Look Up Code ]

Behavior:

1. Trim and normalize input.
2. Keep it as a string.
3. Preserve leading zeros.
4. Search IndexedDB.
5. Use the same known/unknown product flow as camera scanning.

Example:

Input:

0123456789012

Expected lookup value:

"0123456789012"

Do not create a separate product-processing implementation for manual
lookup.

Camera and manual entry must share the same processing flow.

==================================================
20. MANUAL PRODUCT ENTRY
==================================================

Keep the existing direct manual entry option:

[ Add Item Manually ]

This option may navigate directly to:

/products/new

without requiring a barcode.

The user should have three practical paths:

1. Scan barcode
2. Enter barcode manually
3. Add product without barcode

==================================================
21. ADD KNOWN PRODUCT TO BASKET
==================================================

When the user confirms an existing scanned product:

1. Validate current price.
2. Validate quantity.
3. Reuse the existing Product ID.
4. Update Product.lastPrice if price changed.
5. Update Product.updatedAt.
6. Persist the Product in IndexedDB.
7. Add or merge the BasketItem through BasketContext.
8. Persist the basket through Phase 7 behavior.
9. Create an appropriate price-history record.
10. Navigate to the Basket page or show scan-another options.

Do not bypass BasketContext.

==================================================
22. DUPLICATE BASKET ITEM POLICY
==================================================

Preserve the existing ScanCart duplicate policy.

If the scanned product is already in the basket:

- Do not create an unnecessary duplicate row.
- Increase the existing quantity.
- Update the basket price to the newly confirmed current price.
- Persist the updated basket item.

Example:

Existing basket:

Fresh Milk
Barcode: 4801234567890
Price: ₱95
Quantity: 1

Scanned again:

Fresh Milk
Current Price: ₱99
Quantity: 2

Expected basket:

Fresh Milk
Price: ₱99
Quantity: 3
Subtotal: ₱297

==================================================
23. PRICE HISTORY INTEGRATION
==================================================

Use the Phase 7 price-history repository.

When the user confirms a scanned product's current price, create a price
record when appropriate.

Example:

{
  id: "...",
  productId: "product-123",
  store: "SM Supermarket",
  price: 99,
  recordedAt: "..."
}

Do not create price records merely because the scanner detected an item.

Create the record only after explicit price confirmation or successful
Add to Basket.

Avoid duplicate price records caused by re-renders or repeated callback
events.

==================================================
24. SCAN-ANOTHER WORKFLOW
==================================================

Grocery shopping requires scanning multiple products quickly.

After adding an item, provide a clear next action:

[ Scan Another Item ]

Also provide:

[ View Basket ]

Recommended flow:

Product added
     ↓
Success feedback
     ↓
┌──────────────┴──────────────┐
│                             │
Scan Another              View Basket
│                             │
Restart scanner           /basket
on user action

Do not restart the camera unexpectedly without user awareness.

Reset:

- Scan lock
- Previous scanned value
- Lookup status
- Product-result state
- Temporary errors

before scanning another item.

==================================================
25. CAMERA SELECTION
==================================================

Prefer the rear-facing camera.

If practical with the chosen library, support switching between available
cameras.

Possible action:

[ Switch Camera ]

Do not require this feature if only one usable camera is available.

Do not display raw device IDs unnecessarily.

If camera switching significantly complicates the current implementation,
prioritize reliable rear-camera scanning first and document camera
switching as a known limitation.

==================================================
26. SCANNING AREA
==================================================

Create a clear scanning area.

Requirements:

- Video fills the scan container
- Maintain a reasonable aspect ratio
- Avoid distorted video
- Add an overlay/frame indicating where to position the barcode
- Avoid blocking the whole video with decorative elements
- Ensure controls remain usable on 360px-wide screens

The overlay is visual guidance only.

Do not imply that the browser camera reads only inside the overlay unless
the implementation actually crops the detection region.

==================================================
27. FLASHLIGHT OR TORCH
==================================================

Torch support differs by device and browser.

If the selected camera track exposes a supported torch capability, an
optional flashlight control may be added.

Requirements:

- Feature-detect support
- Hide or disable the control when unavailable
- Do not assume every device supports torch mode
- Do not let torch failure break barcode scanning

This is optional for Phase 8.

Prioritize reliable scanning and cleanup over flashlight support.

==================================================
28. SCANNER STATES
==================================================

Define explicit scanner states.

Suggested states:

type ScannerStatus =
  | "idle"
  | "requesting-permission"
  | "scanning"
  | "detected"
  | "looking-up"
  | "found"
  | "not-found"
  | "permission-denied"
  | "unsupported"
  | "error";

Use names consistent with the existing project.

Do not manage scanner behavior using many unrelated booleans that can
produce contradictory states.

Example invalid combination to avoid:

isScanning = true
permissionDenied = true
productFound = true
isLookingUp = true

Prefer a predictable state machine or reducer when it improves clarity.

==================================================
29. LOADING STATES
==================================================

Show useful progress while:

- Camera permission is requested
- Scanner initializes
- IndexedDB product lookup runs
- Product is being added
- Product update is being persisted

Examples:

"Starting camera..."

"Looking up product..."

"Adding to basket..."

Disable conflicting controls during active operations.

Do not leave ScanCart indefinitely stuck in a loading state after an
error.

==================================================
30. ERROR STATES
==================================================

Handle at least:

CAMERA PERMISSION DENIED

Message:

"Camera permission was denied. Allow camera access in your browser
settings or enter the barcode manually."


NO CAMERA

Message:

"No camera is available on this device. Enter the barcode manually."


UNSUPPORTED BROWSER

Message:

"Camera scanning is not supported in this browser. Enter the barcode
manually."


CAMERA IN USE

Message:

"The camera may be in use by another application. Close the other camera
application and try again."


LOOKUP FAILURE

Message:

"We couldn't look up this product. Try again or enter the details
manually."


SCANNER FAILURE

Message:

"We couldn't scan the barcode. Try better lighting, move the camera, or
enter the code manually."

Use concise, user-friendly text.

Do not expose raw exception messages.

==================================================
31. RETRY BEHAVIOR
==================================================

Provide recoverable actions where appropriate:

[ Try Camera Again ]

[ Enter Code Manually ]

[ Add Item Manually ]

[ Go Back ]

A retry must clean up the previous scanner instance before creating a
new one.

Do not stack multiple camera streams.

==================================================
32. ACCESSIBILITY
==================================================

Use:

- Semantic headings
- Accessible buttons
- Visible focus states
- Status messages
- aria-live for meaningful scanner status updates
- Accessible labels for camera controls
- Proper labels for manual barcode and price fields
- Error descriptions connected to inputs
- Keyboard-accessible manual entry and product confirmation

The live video is not sufficient as the only source of instructions.

Provide text guidance.

Do not rely exclusively on color or animation to indicate scanner state.

==================================================
33. PRIVACY AND USER TRUST
==================================================

Camera access must be transparent.

Display a short explanation before or near camera activation:

"ScanCart uses your camera only to read product barcodes and QR codes."

Do not capture still photos unless technically required.

Do not upload images or video.

Do not save camera frames to IndexedDB.

Do not send camera data to an external server.

The Phase 8 scanner should process codes locally in the browser.

Do not imply that camera data is stored.

==================================================
34. SECURITY
==================================================

Treat scanned content as untrusted input.

Requirements:

- Never execute scanned content
- Never inject scanned text using dangerouslySetInnerHTML
- Never automatically open a scanned URL
- Never evaluate scanned JavaScript
- Never treat QR content as trusted HTML
- Escape scanned values through normal React rendering
- Validate values before database insertion

If a QR code contains a URL, display it as plain text unless a future
explicit user-controlled workflow is introduced.

==================================================
35. CLIENT COMPONENT BOUNDARIES
==================================================

The scanner depends on browser APIs.

Scanner components must be Client Components.

Use:

"use client"

only where required.

Do not access:

navigator.mediaDevices
window
document
indexedDB

during server rendering.

Avoid:

ReferenceError: navigator is not defined

Avoid:

ReferenceError: window is not defined

Keep static page layout as server-rendered where practical.

==================================================
36. DYNAMIC IMPORT IF NEEDED
==================================================

If the scanning library causes server-rendering problems, use a
browser-only dynamic import or load it inside a client-side lifecycle.

Do not disable server-side rendering for unrelated parts of ScanCart.

Document why a browser-only import is required if used.

==================================================
37. PERFORMANCE
==================================================

Avoid:

- Multiple ZXing reader instances
- Multiple active camera streams
- Continuous state updates for every failed frame
- Re-rendering the entire page on every camera callback
- Repeated IndexedDB lookups for the same locked result
- Loading unnecessary scanner code on every ScanCart page

Prefer loading scanner functionality only on the /scan route.

==================================================
38. NAVIGATION CLEANUP
==================================================

If the user navigates from /scan to:

- Home
- Basket
- Product form
- Another route

the camera must stop.

Route changes must not leave the camera active in the background.

Use effect cleanup or the scanner library's control methods appropriately.

==================================================
39. HOME PAGE INTEGRATION
==================================================

Update the ScanCart Home page.

When a shopping session is active, provide:

[ Scan Item ]

[ Add Item Manually ]

Scan Item navigates to:

/scan

Add Item Manually navigates to:

/products/new

When no session is active, preserve the Start Shopping workflow.

Do not activate the camera directly from the Home page.

==================================================
40. BASKET PAGE INTEGRATION
==================================================

On the Basket page, provide an action such as:

[ Scan Another Item ]

This navigates to:

/scan

Also retain:

[ Add Item Manually ]

Ensure the bottom navigation and basket badge remain consistent with
the existing application.

==================================================
41. PRODUCT RESULT ROUTING
==================================================

Choose a clean result strategy that fits the current architecture.

Acceptable approaches include:

A. Handle product result state within /scan.

B. Navigate to a dedicated product confirmation route such as:

/products/[barcode]

C. Reuse the ProductForm route for unknown products.

Whichever approach is chosen:

- Do not duplicate forms
- Preserve browser refresh behavior where practical
- Preserve leading zeros in route/query values
- Encode route/query data safely
- Keep the flow understandable

==================================================
42. URL ENCODING
==================================================

If scanned values are placed in query strings or route segments:

- Encode values safely
- Decode them consistently
- Preserve leading zeros
- Treat arbitrary QR content cautiously
- Avoid putting very large or sensitive content into URLs
- Reject unsuitable values from product-barcode routes

For unknown retail barcodes, a query parameter is acceptable:

/products/new?barcode=0123456789012

==================================================
43. SUCCESS FEEDBACK
==================================================

After adding a scanned product:

Display an accessible message such as:

"Fresh Milk was added to your basket."

Avoid browser alert() if ScanCart already has a status or toast pattern.

Prevent the success action from accidentally firing twice.

==================================================
44. DO NOT IMPLEMENT YET
==================================================

Do NOT implement:

- External product lookup APIs
- Open Food Facts integration
- Supermarket inventory APIs
- Receipt scanning
- OCR
- Image recognition
- Supabase
- PostgreSQL
- Authentication
- Cloud synchronization
- Completed shopping history UI
- Price-history charts
- Automatic price extraction from retail barcodes
- Automatic navigation to QR URLs
- PWA installation
- Service workers
- Push notifications

These belong to later phases or separate optional enhancements.

==================================================
45. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing ScanCart project.

Relevant structure may approximately become:

src/
│
├── app/
│   ├── page.tsx
│   ├── scan/
│   │   └── page.tsx
│   ├── basket/
│   │   └── page.tsx
│   └── products/
│       └── new/
│           └── page.tsx
│
├── components/
│   ├── scanner/
│   │   ├── BarcodeScanner.tsx
│   │   ├── ScannedProductResult.tsx
│   │   ├── ManualCodeEntry.tsx
│   │   └── ScannerStatus.tsx
│   │
│   ├── product/
│   │   └── ProductForm.tsx
│   │
│   ├── basket/
│   └── shopping/
│
├── context/
│   ├── ShoppingSessionContext.tsx
│   └── 