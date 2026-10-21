Continue developing my existing ScanCart project.

IMPORTANT:
Phases 1 through 10 are already implemented.

Do not recreate the project.
Do not rename ScanCart.
Do not replace working functionality.

Before writing code:

1. Inspect the existing project structure.
2. Inspect package.json.
3. Inspect the installed Next.js version.
4. Review next.config.*.
5. Review the root app layout and metadata configuration.
6. Review the IndexedDB architecture.
7. Review ShoppingSessionContext.
8. Review BasketContext.
9. Review the Phase 8 camera/barcode scanner.
10. Review Shopping History.
11. Review Price History.
12. Review existing public assets and icons.
13. Review the current deployment/build configuration.
14. Preserve all working functionality from Phases 1 through 10.

Do not blindly install a PWA dependency.

First determine whether the current Next.js version and project
architecture can implement the required PWA functionality cleanly using
native web-app manifest and service-worker capabilities.

If a library is genuinely needed, explain why before introducing it and
use only one PWA/service-worker solution.

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
- Existing IndexedDB wrapper
- ZXing barcode/QR scanning
- Existing local persistence architecture

==================================================
PHASE 11 GOAL
==================================================

Convert ScanCart into an installable Progressive Web App while preserving
the website experience.

ScanCart should continue to work as:

1. A normal website in the browser
2. An installable web app on supported devices

Implement:

- Web App Manifest
- ScanCart application metadata
- App icons
- Standalone display configuration
- Theme colors
- Service worker where appropriate
- Offline application-shell strategy
- Offline status UX
- Installability support
- Safe update behavior
- PWA-specific testing

Do not redesign the entire application.

==================================================
1. FIRST PRINCIPLE
==================================================

ScanCart remains a website.

PWA functionality should enhance the existing application.

Architecture:

Browser
   |
   v
ScanCart Website
   |
   +---- Installable PWA
   |
   +---- IndexedDB local data
   |
   +---- Camera barcode scanner
   |
   +---- Offline-capable application shell

Do not create a separate React Native, Expo, Android, or iOS project.

There should still be one ScanCart codebase.

==================================================
2. PRESERVE EXISTING FEATURES
==================================================

PWA changes must not break:

- Home
- Shopping session
- Store selection
- Budget management
- Basket
- Manual product entry
- Barcode scanner
- QR scanner
- IndexedDB
- Product persistence
- Basket persistence
- Active-session persistence
- Shopping History
- Price History
- Price analytics
- End Shopping
- Bottom navigation

Regression-test these important flows after PWA changes.

==================================================
3. WEB APP MANIFEST
==================================================

Implement a standards-compliant web app manifest using the method best
supported by the installed Next.js version.

Prefer the current Next.js App Router metadata/manifest approach if
appropriate.

Possible location:

src/app/manifest.ts

or:

public/manifest.webmanifest

Choose one approach consistent with the project's Next.js version.

Do not maintain duplicate manifests.

Configure fields such as:

name:
ScanCart

short_name:
ScanCart

description:
A grocery barcode scanner, basket total tracker, and personal price
history app.

start_url:
/

display:
standalone

background_color:
Use the existing ScanCart background color.

theme_color:
Use the existing ScanCart primary brand color.

orientation:
Do not unnecessarily lock orientation unless the existing ScanCart UX
requires it.

Prefer allowing the device to choose orientation.

==================================================
4. APP METADATA
==================================================

Review the Next.js root layout.

Ensure application metadata consistently uses:

ScanCart

Configure appropriate metadata such as:

title:
ScanCart

description:
A concise description of ScanCart

applicationName:
ScanCart

Do not continue using old placeholder project names.

Do not leave:

Next.js App

Create Next App

BasketWise

or other obsolete names in user-facing metadata.

Search the project for obsolete branding and safely replace remaining
user-facing occurrences with ScanCart where applicable.

==================================================
5. PWA ICONS
==================================================

Provide appropriate ScanCart app icons.

At minimum prepare manifest-compatible icons such as:

192x192
512x512

Also consider a maskable icon variant.

Use the existing ScanCart logo or icon if one already exists.

Do not replace an existing approved ScanCart brand identity without a
clear reason.

Store assets under an appropriate public directory such as:

public/icons/

Example:

public/icons/
  icon-192.png
  icon-512.png
  maskable-512.png

Ensure the manifest points to valid files.

==================================================
6. ICON DESIGN REQUIREMENTS
==================================================

If ScanCart does not yet have finalized icons, use the existing project
visual language and create appropriate placeholder app-icon assets only
if the existing development environment supports doing so.

The icon concept should represent ScanCart clearly, for example:

shopping cart + barcode/scanning concept

Requirements:

- Recognizable at small size
- Simple silhouette
- Good contrast
- No tiny unreadable text
- Safe padding
- Appropriate background
- Should work when displayed as a phone home-screen icon

Do not use third-party logos or copyrighted supermarket branding.

==================================================
7. FAVICON / BROWSER ICON
==================================================

Ensure ScanCart has an appropriate browser icon/fav icon using the
existing Next.js convention.

Do not leave the default framework favicon if proper ScanCart branding
already exists or can be configured from existing assets.

Keep browser and installed-app branding visually consistent.

==================================================
8. SERVICE WORKER STRATEGY
==================================================

Determine the most suitable service-worker approach based on the
installed Next.js version and existing architecture.

Goals:

- Cache the application shell appropriately
- Improve resilience to temporary network loss
- Provide a useful offline fallback
- Avoid stale application behavior
- Preserve IndexedDB user data
- Avoid interfering with camera scanning

Do NOT blindly cache every request.

Do NOT cache mutation-like operations indiscriminately if future APIs
exist.

Document the chosen strategy briefly in code comments or project
documentation.

==================================================
9. SERVICE WORKER SCOPE
==================================================

Ensure the service worker has the intended ScanCart scope.

It should apply to the ScanCart application without unexpectedly
controlling unrelated applications or paths.

Avoid manually constructing scope logic unless necessary.

==================================================
10. CACHE VERSIONING
==================================================

Use explicit and maintainable cache names.

Example idea:

scancart-static-v1

Do not accumulate obsolete caches indefinitely.

When installing/activating a newer worker:

- Preserve the current required caches
- Remove obsolete ScanCart cache versions when appropriate
- Do NOT touch IndexedDB user data

Cache cleanup and IndexedDB cleanup are completely different operations.

==================================================
11. NEVER CLEAR INDEXEDDB DURING PWA UPDATE
==================================================

CRITICAL:

Service worker updates, cache updates, or application upgrades must NOT:

- Delete products
- Delete basket
- Delete active session
- Delete shopping history
- Delete price history

IndexedDB remains the user's primary ScanCart data store.

Do not call:

indexedDB.deleteDatabase(...)

during:

- Service worker installation
- Service worker activation
- Cache cleanup
- App update

PWA updates must preserve user data.

==================================================
12. OFFLINE APPLICATION SHELL
==================================================

When practical, ensure key application UI can load after it has
previously been visited/cached.

Important routes may include:

/
 /basket
 /scan
 /history

Do not promise every dynamic experience works offline unless it actually
does.

Because much of ScanCart's current data is already stored in IndexedDB,
use that local architecture rather than duplicating data into Cache
Storage.

Cache application assets.

Keep data in IndexedDB.

==================================================
13. CACHE STORAGE VS INDEXEDDB
==================================================

Maintain a clear responsibility boundary.

Cache Storage:

- Static application resources
- Application shell
- Appropriate framework/static assets
- Offline fallback resources

IndexedDB:

- Products
- Basket
- Shopping session
- Price history
- Shopping history

Do NOT save database records into the service-worker asset cache.

Do NOT move Phase 7 IndexedDB data into Cache Storage.

==================================================
14. OFFLINE ROUTE
==================================================

If appropriate for the chosen service-worker strategy, create an offline
fallback experience.

Example:

You're offline

ScanCart can still access locally stored shopping data where supported.

Some features may require connectivity.

[ Try Again ]

Keep the page consistent with ScanCart's mobile design.

Do not imply that features work offline if they have not been verified.

==================================================
15. ONLINE / OFFLINE STATUS
==================================================

Add a lightweight network-status indicator when useful.

Possible implementation:

useOnlineStatus()

based on browser connectivity events.

Expose statuses such as:

online
offline

Example UI:

Offline

"You're offline. Local ScanCart data is still available."

Do not show large disruptive alerts every time network status changes.

A small banner is preferable.

==================================================
16. OFFLINE DATA BEHAVIOR
==================================================

Review each major ScanCart feature.

Because Products, Basket, Sessions, Price History, and Shopping History
are stored in IndexedDB, their local operations should continue to use
the existing local database regardless of network state.

Do not add unnecessary network checks around local IndexedDB actions.

Example:

Add product manually
    |
IndexedDB
    |
Should not require a network request

Similarly:

Basket calculations

should remain local.

==================================================
17. BARCODE SCANNER OFFLINE BEHAVIOR
==================================================

Review Phase 8.

If ZXing scanning is bundled locally with the ScanCart application, do
not introduce a network dependency for every scan.

Verify whether the scanner can initialize from the cached application
bundle after ScanCart has been loaded previously.

Do not claim camera scanning works offline unless verified.

Manual barcode entry must remain available.

==================================================
18. CAMERA + INSTALLED PWA
==================================================

Regression-test camera behavior when ScanCart is launched as an installed
PWA where the test environment supports it.

Check:

- Camera permission
- Rear-camera preference
- Barcode scanning
- Scanner cleanup
- Route navigation
- Camera stopping after result
- Camera stopping after leaving /scan

Do not redesign scanner logic unless PWA mode exposes a concrete issue.

==================================================
19. SECURE CONTEXT
==================================================

Review the deployment environment to ensure browser features requiring a
secure context are supported in production.

Do not disable security checks.

Do not add workarounds that expose camera data insecurely.

Development-local behavior may differ from deployed production behavior.

Document any verified deployment requirements.

==================================================
20. INSTALL EXPERIENCE
==================================================

Do not aggressively force installation.

ScanCart must remain fully usable in the browser.

If the browser exposes an install-prompt event that the application can
handle, create an optional install experience.

Possible UI:

Install ScanCart

"Add ScanCart to your home screen for quicker access."

[ Install ]

[ Not Now ]

Show it unobtrusively.

Do not repeatedly interrupt the user.

==================================================
21. INSTALL PROMPT HANDLING
==================================================

If implementing a custom install button:

- Capture the relevant supported browser install event
- Store it only in memory
- Show Install only when installation can actually be prompted
- Hide the action after successful installation
- Handle user dismissal gracefully

Do not assume every browser exposes the same install-prompt API.

Do not show a broken Install button on unsupported browsers.

==================================================
22. IOS INSTALL GUIDANCE
==================================================

Do not assume the same programmatic installation behavior across all
browsers/platforms.

If no direct install prompt is available but an installable workflow
exists, provide concise platform-appropriate guidance only when the
environment can be reliably identified.

Do not display Android-specific instructions on every device.

Keep browser-specific instructional logic isolated.

==================================================
23. INSTALLED APP DETECTION
==================================================

If helpful, detect standalone display mode using standard browser
capabilities.

Use this only for small UX improvements.

Do not create an entirely separate UI for installed mode.

The same core ScanCart interface should work in both:

Browser

and

Installed PWA

==================================================
24. START URL
==================================================

The installed application should open ScanCart at a predictable route.

Use:

/

as the default start URL unless the current routing/deployment model
requires a different base path.

Do not start directly in:

/scan

because camera permission should not be requested immediately when the
installed app launches.

==================================================
25. APP NAVIGATION
==================================================

Preserve:

Home
Scan
Basket
History

Installed mode should behave naturally with these routes.

Check:

- Internal navigation
- Browser/OS back behavior where testable
- History details
- Product price pages
- Manual product form

Do not use full page reloads unnecessarily.

==================================================
26. SAFE-AREA SUPPORT
==================================================

Installed PWAs may run closer to device-screen edges.

Review ScanCart's mobile layout for safe-area handling.

Where appropriate, support CSS environment values such as safe-area
insets for:

- Bottom navigation
- Top header
- Fixed controls

Do not add excessive padding to ordinary desktop/browser layouts.

Aim to prevent controls from being obscured by device UI.

==================================================
27. VIEWPORT / MOBILE EXPERIENCE
==================================================

Keep ScanCart optimized for approximately:

360px - 430px smartphone widths.

Verify:

- No horizontal scrolling
- Bottom navigation remains reachable
- Scanner fits available screen space
- Forms remain usable
- History cards remain readable
- Price-history cards remain readable
- Dialogs fit smaller screens
- Installed mode does not clip controls

==================================================
28. APP THEME
==================================================

Use ScanCart's existing color palette.

Manifest theme color should coordinate with the current UI.

Do not introduce a completely different PWA-specific color scheme.

Review browser chrome/status bar integration where metadata supports it.

==================================================
29. SPLASH EXPERIENCE
==================================================

Do not build a fake long-running splash screen.

Use manifest/app metadata and icons as supported by the platform.

If a minimal application-loading state already exists, keep it fast and
consistent with ScanCart.

Do not intentionally delay application startup for branding.

==================================================
30. UPDATE STRATEGY
==================================================

Service-worker updates can create confusing stale-version behavior.

Implement a predictable update strategy.

When a new ScanCart version becomes available, choose an approach
appropriate to the selected service-worker implementation.

Possible UX:

"An update is available."

[ Update ]

Avoid forcing an unexpected reload while the user is actively shopping
if that could disrupt their workflow.

Do not clear basket or session state during updates.

==================================================
31. ACTIVE SHOPPING SESSION UPDATE SAFETY
==================================================

If a service-worker/app update becomes available while:

- The user has an active session
- The basket contains items

do not automatically discard local state.

Because active state is persisted in IndexedDB, verify it survives
reload/update.

Prefer update UX that lets the user control a potentially disruptive
reload.

==================================================
32. CACHE FAILURE
==================================================

If service-worker registration fails:

ScanCart should still function as a normal website.

Do not make application startup depend entirely on successful service
worker registration.

PWA enhancement failure must not block:

- Shopping
- Basket
- Scanner
- History
- Product lookup

==================================================
33. UNSUPPORTED PWA ENVIRONMENT
==================================================

If the browser does not support a required PWA feature:

Gracefully fall back to normal browser operation.

Do not show:

"Your device is unsupported"

when only installation is unavailable but ScanCart itself still works.

==================================================
34. CLIENT COMPONENT BOUNDARIES
==================================================

Browser-specific APIs must only run client-side.

Examples:

window
navigator
serviceWorker
online/offline events
matchMedia
install prompt events

Do not access these during server rendering.

Avoid:

window is not defined

navigator is not defined

hydration mismatches

Use "use client" only where required.

==================================================
35. SERVICE WORKER REGISTRATION
==================================================

If explicit registration is needed by the chosen approach, isolate it in
a small client-side component or utility.

Example concept:

ServiceWorkerRegistration

The component should:

- Register once
- Handle failures safely
- Detect updates if implemented
- Avoid rendering unnecessary UI

Do not scatter registration logic across pages.

==================================================
36. OFFLINE STATUS HOOK
==================================================

If needed, create:

src/hooks/useOnlineStatus.ts

Responsibilities:

- Read initial browser connectivity status
- Listen for online events
- Listen for offline events
- Clean up event listeners
- Return predictable state

Do not treat navigator.onLine as proof that a remote server is
reachable.

Use it only as a browser connectivity indicator.

==================================================
37. INSTALLATION HOOK
==================================================

If implementing custom installation functionality, isolate it.

Possible:

src/hooks/usePWAInstall.ts

Responsibilities may include:

- Capture supported install event
- Expose canInstall
- Trigger prompt
- Detect successful installation where possible
- Handle dismissal
- Clean up event listeners

Do not embed this implementation inside the Home page.

==================================================
38. PWA COMPONENTS
==================================================

Create components only if they have clear responsibility.

Possible structure:

src/components/pwa/
├── InstallPrompt.tsx
├── OfflineBanner.tsx
├── UpdateAvailable.tsx
└── ServiceWorkerRegistration.tsx

Do not create unnecessary components if the current architecture can
remain simpler.

==================================================
39. INSTALL PROMPT LOCATION
==================================================

If custom installation UI is supported, place it somewhere unobtrusive.

Possible locations:

- Home page card
- Settings area
- Small dismissible banner

Do NOT cover:

- Scanner
- Add to Basket controls
- Budget summary
- Checkout/end-shopping controls

Installation is optional.

Shopping is primary.

==================================================
40. PERSIST INSTALL-PROMPT DISMISSAL CAREFULLY
==================================================

If ScanCart remembers that the user dismissed a custom install message,
use a small UI-preference mechanism.

Do NOT mix preference data into product/basket history stores.

Do not permanently hide install functionality if the user may reasonably
want it later.

Keep this implementation minimal in Phase 11.

==================================================
41. OFFLINE SCENARIO
==================================================

Design for this workflow:

User previously opened ScanCart online.
        |
        v
Required app shell/assets cached.
        |
Internet becomes unavailable.
        |
        v
Open ScanCart
        |
        +---- Cached application shell
        |
        +---- IndexedDB
                 |
                 +---- Products
                 +---- Basket
                 +---- Session
                 +---- Shopping History
                 +---- Price History

Do not claim first-ever loading of the website works offline.

The browser must have had an opportunity to load/cache required
resources first.

==================================================
42. INDEXEDDB REMAINS SOURCE OF TRUTH
==================================================

Do not duplicate:

products
basket
shopping sessions
shopping history
price history

inside the service worker cache.

IndexedDB remains the source of truth for app records.

If the service worker is removed or cache storage is cleared, IndexedDB
data should remain intact unless the browser/user explicitly deletes site
data.

==================================================
43. NO BACKGROUND SYNC YET
==================================================

Do NOT implement Background Sync in Phase 11.

ScanCart currently uses local IndexedDB as the core data store.

There is no cloud server requiring offline synchronization yet.

Avoid adding unnecessary complexity.

==================================================
44. NO PUSH NOTIFICATIONS YET
==================================================

Do NOT implement:

- Push notifications
- Notification permissions
- Notification server
- Firebase Cloud Messaging

These are not required for ScanCart's current functionality.

==================================================
45. NO CLOUD BACKEND
==================================================

Do NOT introduce:

- Supabase
- Firebase database
- PostgreSQL
- Authentication
- Cloud synchronization

Phase 11 is PWA/installability, not cloud migration.

==================================================
46. MANIFEST VALIDATION
==================================================

Verify that the generated manifest:

- Loads successfully
- Is valid
- References existing icons
- Uses ScanCart branding
- Has an appropriate start URL
- Has standalone display configured

Check that manifest URLs resolve correctly in the deployed application.

Do not leave broken icon paths.

==================================================
47. INSTALLABILITY TESTING
==================================================

Where supported by the development environment, verify:

- Manifest detected
- Service worker registered when required
- App considered installable under the chosen implementation
- App can be launched in standalone mode
- Name displays as ScanCart
- Correct icon appears

Do not claim successful device installation if it was not actually
tested.

Report physical-device installation as pending when applicable.

==================================================
48. OFFLINE TESTING
==================================================

Test a practical sequence:

1. Open ScanCart online.
2. Allow service worker/app assets to initialize.
3. Create or load local IndexedDB data.
4. Reload normally.
5. Simulate offline mode.
6. Reload ScanCart where the environment supports this test.
7. Verify available cached UI.
8. Verify local IndexedDB data.
9. Return online.
10. Verify normal operation continues.

Document which routes/features were verified offline.

==================================================
49. SCANNER TESTING
==================================================

Verify that PWA changes did not break Phase 8.

Test:

- Start camera
- Scan known barcode
- Scan unknown barcode
- Manual barcode fallback
- Add product
- Stop camera
- Navigate away
- Scan another item

Where practical, test both:

Browser mode

and:

Installed PWA mode

Do not claim installed-device scanner testing unless actually performed.

==================================================
50. HISTORY TESTING
==================================================

Verify offline/local access where supported to:

/history

and individual history details after the relevant application resources
have been cached.

History data itself must continue coming from IndexedDB.

Do not create duplicate shopping history because of service-worker
events.

==================================================
51. PRICE HISTORY TESTING
==================================================

Verify Phase 10 still works after PWA conversion:

- Product price history loads
- Latest price is correct
- Store comparison works
- Same-store scanner comparison works
- No price record is created merely from PWA lifecycle events
- No records disappear after app update

==================================================
52. INSTALLATION MUST NOT RESET DATA
==================================================

Test this scenario where possible:

Browser ScanCart contains:

Products
Basket
Shopping History
Price History

Install ScanCart as a PWA.

Expected:

Installation must not intentionally reset IndexedDB.

Likewise, launching installed mode must not run a "fresh installation"
database reset.

==================================================
53. UPDATE MUST NOT RESET DATA
==================================================

Test or verify architecturally:

Old ScanCart version
        |
IndexedDB contains user data
        |
New service worker/version
        |
Activation/update
        |
Expected:
IndexedDB records remain intact

Do not connect service-worker cache version to IndexedDB deletion.

==================================================
54. UNINSTALL / BROWSER DATA NOTE
==================================================

Do not make guarantees about data surviving user-driven browser/site-data
deletion or platform-specific uninstall behaviors unless this has been
verified for the target platform.

ScanCart should preserve data through normal application updates within
its own implementation.

==================================================
55. PERFORMANCE
==================================================

PWA implementation must not significantly increase initial application
complexity unnecessarily.

Avoid caching massive unnecessary assets.

Avoid preloading every route solely because it exists.

Keep the scanner bundle appropriately scoped where possible.

Optimize for mobile grocery-store usage.

==================================================
56. SECURITY
==================================================

Do not weaken browser security to enable PWA behavior.

Do not:

- Disable HTTPS requirements
- Bypass camera permissions
- Cache sensitive arbitrary external responses
- Automatically execute QR content
- Inject service-worker code from untrusted sources

Use only ScanCart-controlled service-worker code and assets.

==================================================
57. OPTIONAL APP SHORTCUTS
==================================================

If the manifest approach and current browser support make shortcuts easy
and maintainable, consider shortcuts such as:

Scan Item
Basket

Example conceptual targets:

/scan
/basket

This is optional.

Do not make manifest shortcuts essential to navigation.

Do not include routes that bypass the active-session checks.

==================================================
58. DO NOT IMPLEMENT IN PHASE 11
==================================================

Do NOT implement:

- React Native
- Expo
- Native Android application
- Native iOS application
- APK generation
- App Store submission
- Google Play submission
- External grocery APIs
- Cloud database
- Authentication
- Supabase
- Firebase database
- PostgreSQL
- Background Sync
- Push notifications
- Receipt OCR
- Price prediction
- Household sharing

These are future features if ScanCart needs them.

==================================================
59. EXPECTED PROJECT STRUCTURE
==================================================

Integrate with the existing ScanCart project.

Relevant additions may approximately include:

src/
|
├── app/
│   ├── layout.tsx
│   ├── manifest.ts
│   ├── page.tsx
│   ├── scan/
│   ├── basket/
│   ├── history/
│   └── products/
|
├── components/
│   ├── pwa/
│   │   ├── InstallPrompt.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── UpdateAvailable.tsx
│   │   └── ServiceWorkerRegistration.tsx
│   ├── scanner/
│   ├── basket/
│   ├── history/
│   └── price/
|
├── hooks/
│   ├── useOnlineStatus.ts
│   └── usePWAInstall.ts
|
└── ...

public/
|
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── maskable-512.png
|
└── service worker file if required by the chosen implementation

Do NOT blindly create every file listed above.

Inspect the existing architecture first.

Create only files that have a clear responsibility.

==================================================
60. REQUIRED TEST SCENARIOS
==================================================

Verify at minimum:

TEST 1: NORMAL BROWSER MODE

Open ScanCart normally.

Expected:

Application works as before.
Home loads.
Shopping session works.
Basket works.


TEST 2: MANIFEST

Expected:

Manifest loads successfully.

Name:
ScanCart

Short name:
ScanCart

Display:
standalone

Icon references resolve.


TEST 3: PWA INSTALLATION SIGNAL

In a supported environment:

Expected:

The browser recognizes the application's installability according to the
chosen PWA implementation.

Do not claim successful physical-device installation unless tested.


TEST 4: INSTALLED LAUNCH

If testable:

Launch installed ScanCart.

Expected:

Application opens in the configured standalone experience.

Start route is correct.


TEST 5: EXISTING DATA

Before PWA update:

Product:
Fresh Milk

Basket:
Fresh Milk × 2

Expected after PWA implementation/update:

Product still exists.
Basket still exists.


TEST 6: ACTIVE SESSION

Existing session:

Store:
SM Supermarket

Budget:
₱3,000

Update/reload ScanCart.

Expected:

Active session remains.


TEST 7: SHOPPING HISTORY

Existing historical trips exist.

After PWA implementation:

Expected:

History records remain available.


TEST 8: PRICE HISTORY

Fresh Milk has historical prices.

After PWA implementation:

Expected:

Price history remains intact.


TEST 9: OFFLINE INDICATOR

Simulate offline state.

Expected:

A concise offline indicator appears if implemented.

Application does not crash.


TEST 10: RETURN ONLINE

Switch from offline to online.

Expected:

Indicator updates appropriately.
Application remains functional.


TEST 11: CACHED APP SHELL

After necessary resources have previously loaded/cached:

Simulate offline and reload where supported.

Expected:

Configured offline/app-shell functionality works as designed.

Document exactly what was verified.


TEST 12: INDEXEDDB OFFLINE

While offline:

Open locally stored basket/history functionality where the application
shell supports it.

Expected:

Existing IndexedDB data remains available.


TEST 13: CAMERA REGRESSION

Go to:

/scan

Expected:

Existing camera scanner still initializes correctly in normal supported
conditions.


TEST 14: CAMERA CLEANUP

Open scanner.

Navigate to Basket.

Expected:

Camera stops.

PWA/service-worker changes must not cause scanner lifecycle regressions.


TEST 15: UNKNOWN PRODUCT

Scan unknown barcode.

Expected:

Existing Phase 8 ProductForm flow still works.


TEST 16: KNOWN PRODUCT

Scan known barcode.

Expected:

IndexedDB lookup still works.
Price comparison still works.


TEST 17: UPDATE

If service-worker update UX is implemented:

Simulate/detect new version.

Expected:

User receives appropriate update behavior.

Active data is not cleared.


TEST 18: SERVICE WORKER FAILURE

Simulate registration failure where practical.

Expected:

ScanCart continues operating as a normal website.


TEST 19: INSTALL-PROMPT UNAVAILABLE

Browser does not expose supported installation prompting.

Expected:

No broken Install button appears.

ScanCart remains usable normally.


TEST 20: SMALL PHONE WIDTH

Test around:

360px wide

Expected:

No horizontal scrolling.
Bottom navigation usable.
PWA banners do not obstruct shopping controls.


TEST 21: SAFE AREA

Where testable in standalone mode:

Expected:

Fixed controls are not hidden behind device UI.


TEST 22: REFRESH INSTALLED APP

With an active basket:

Refresh/restart installed experience where supported.

Expected:

IndexedDB hydration restores local data as before.


TEST 23: END SHOPPING

Complete a shopping trip in PWA-compatible mode.

Expected:

Shopping History saves before basket/session clearing according to the
Phase 9 safety rules.


TEST 24: NO DUPLICATE PRICE RECORDS

Reload/update PWA.

Expected:

Service-worker events do not create PriceHistory records.


TEST 25: QR SECURITY

Scan a QR URL.

Expected:

PWA conversion does not change Phase 8 security behavior.

URL is NOT automatically executed/opened.

==================================================
61. LIGHTHOUSE / PWA AUDIT
==================================================

If the existing development environment has an available Lighthouse or
equivalent browser audit workflow, run an appropriate production-build
audit.

Review applicable findings such as:

- Manifest validity
- Icons
- Service worker
- HTTPS/deployment assumptions
- Mobile usability
- Accessibility

Do not fabricate a Lighthouse score.

Only report a numeric score if the audit was actually executed.

==================================================
62. PRODUCTION BUILD
==================================================

Run the project's production build.

Verify that:

- Manifest generation succeeds
- Service-worker strategy is compatible with production output
- Static assets resolve
- Icons resolve
- Next.js build succeeds
- Scanner client code does not execute on the server
- PWA hooks do not execute browser APIs during SSR

Fix Phase 11-related build errors before considering the phase complete.

==================================================
63. QUALITY CHECKS
==================================================

Run relevant package.json scripts.

Verify:

- TypeScript passes
- ESLint passes
- Existing tests pass
- New PWA-related tests pass
- Production build succeeds
- Manifest is valid
- Service worker registration is safe
- No window/navigator SSR errors
- No hydration mismatch
- IndexedDB data remains intact
- No service-worker-driven data deletion
- Scanner still works
- Shopping History still works
- Price History still works
- No duplicate price records
- No duplicate shopping records
- Mobile layout remains usable
- ScanCart branding is consistent

Fix all Phase 11-related problems before considering the phase complete.

==================================================
64. DOCUMENTATION
==================================================

Update README.md with a concise PWA section.

Document:

- ScanCart is a Progressive Web App
- Development command
- Production build command
- How PWA functionality is tested
- Manifest location
- Service worker approach
- Offline strategy
- IndexedDB remains the local data store
- Browser/device installation behavior that was actually verified

Do not claim support for devices/browsers that were not tested.

==================================================
65. FINAL RESPONSE
==================================================

After completing Phase 11, report:

1. Files created
2. Files modified
3. Files removed, if any
4. Dependencies added or removed
5. PWA approach selected
6. Why that approach fits the installed Next.js version
7. Manifest implementation
8. Icon assets configured
9. Service-worker implementation
10. Cache strategy
11. Offline strategy
12. IndexedDB data-preservation strategy
13. Install-prompt behavior
14. Update behavior
15. Scanner regression-test result
16. Offline test result
17. Browser installability test result
18. Physical Android installation tested or pending
19. Physical iPhone installation tested or pending
20. TypeScript result
21. ESLint result
22. Automated-test result
23. Production-build result
24. Lighthouse result only if actually run
25. Known limitations

Do not claim that anything was tested if it was not actually executed.

Stop after Phase 11 is complete.