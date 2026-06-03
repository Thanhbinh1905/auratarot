# Build Context

## Implementation Summary

- Created a Vite React TypeScript client scaffold.
- Added baseline scripts in `package.json`.
- Added Vitest and React Testing Library setup with one component smoke test.
- Added Playwright configuration and a browser smoke specification for future local verification.
- Added strict TypeScript configuration and ESLint flat configuration.
- Implemented the BUILD-002 app shell on the existing scaffold with a warm candlelit visual system, semantic navigation, the Sanctuary home surface, and placeholders for Journal, Card Library, and Preferences.
- Added design tokens as CSS custom properties for background, surfaces, text, accent, focus, danger, spacing, radius, shadow, and motion timing.
- Added a session-only reduced motion control in Preferences and CSS support for reduced-motion preferences.
- Updated component and browser smoke tests for the shell navigation, primary reading placeholder action, and motion preference control.

## Constraints Maintained

- Existing product requirements document is preserved.
- No production deployment, network analytics, backend, authentication, AI integration, payment flow, or real tarot artwork was introduced.
- No secret or environment values were read or persisted.

## BUILD-003 Implementation Summary

- Added pure TypeScript tarot domain logic under `src/domain/tarot/`.
- Defined complete 78-card tarot identity metadata with stable IDs and symbolic placeholder asset references only.
- Added approved spread definitions for Daily Guidance, Crossroads Timeline, Crossroads Problem-solving, and Decision Maker.
- Added deterministic seeded shuffle, draw, orientation, and reading session creation helpers without browser API dependencies.
- Added warm, practical interpretation output shape with summary, deeper meaning, next step, and journal prompts.
- Added unit tests for deck uniqueness, placeholder guard, spread mapping, deterministic draw behavior, no duplicates, orientation coverage path, decision defaults, undersized deck rejection, and interpretation shape.

## BUILD-003 Constraints Maintained

- Real tarot artwork remains excluded; placeholder references use `placeholder://` symbolic identifiers.
- No UI screens, backend, AI, analytics, payment, deployment, network access, or secret/environment reads were introduced.
- Domain logic remains pure and testable without browser adapters.
- Full tarot reading flow, tarot domain logic, journal persistence, export, and real card library content remain out of scope.

## BUILD-004 Implementation Summary

- Implemented the reading ritual UI on the existing React shell with topic/intention, spread selection, ritual progression, reveal, interpretation, and journal draft states.
- Integrated the existing pure tarot domain module for deterministic spread drawing, card uniqueness, upright/reversed orientation, and interpretation layers.
- Added approved topic chips and all approved spreads, including Decision Maker path names with Path A/Path B defaults.
- Kept user-authored topic/intention/path/journal draft content in React text/value bindings only; no raw HTML rendering was introduced.
- Kept journal save/export visible only as disabled deferred actions.
- Updated component/integration tests and Playwright smoke coverage for completing a local reading flow.

## BUILD-004 Constraints Maintained

- No backend, authentication, analytics, AI, payment, cloud deployment, network reading generation, persistent journal storage, export implementation, or real card artwork was added.
- Reduced Motion remains session-only and the ritual can be completed through button actions without animation-only gates.
- Placeholder symbolic card presentation is used for all reveal surfaces.

## BUILD-005 Implementation Summary

- Added a typed saved-reading snapshot model and client-only local persistence adapter under `src/persistence/savedReadings.ts`.
- Implemented manual Save Reading behavior from completed readings with optional journal note persistence; autosave was not introduced.
- Implemented the Saved Readings Journal list/detail UI with local-only storage limitation copy and empty/error states.
- Added delete confirmation that removes only the selected entry, plus an app-owned local data clear confirmation control.
- Added an unsaved-leave reminder before navigating away from an unsaved completed reading or unsaved note draft.
- Kept export as a disabled placeholder and preserved placeholder-only symbolic card presentation.
- Updated component and Playwright smoke tests for save, local persistence, journal detail, delete confirmation, clear-local-data, corrupt/unavailable storage, local-only copy, unsaved leave, and text-safe user content rendering.

## BUILD-005 Constraints Maintained

- No backend, authentication, analytics, AI, payment, cloud deployment, network sync, real card artwork, or export implementation was added.
- User-authored intention, path, topic, and note content continues to render through React text/value bindings only; no raw HTML rendering path was introduced.
- Persistence is limited to the browser storage key owned by AuraTarot and can be cleared through the app control or by clearing browser data.

## BUILD-006 Implementation Summary

- Implemented an export preview modal for completed current readings and saved reading detail views.
- Added visible journal-note inclusion state; notes are included by default when present and can be excluded before file generation.
- Added a privacy reminder before download actions, stating that topic/question/note may be included and that generation is browser-local only.
- Implemented client-side PDF generation using a minimal text PDF Blob and client-side image generation as an SVG image Blob; no export dependency or remote service was added.
- Export content includes topic, spread, timestamp, cards, orientations, interpretations, and the journal note only when included.
- Added user-safe export failure copy for Blob/download creation failures.
- Updated tests for preview, default note inclusion, note exclusion, saved-reading export, deleted-reading exclusion, XSS-like text rendering, long-note preview handling, local-only no-fetch behavior, and recoverable failure.

## BUILD-006 Constraints Maintained

- No backend, authentication, analytics, AI, payment, cloud deployment, remote export service, service worker, telemetry, or real artwork was introduced.
- User-authored fields continue to render through React text/value bindings; export SVG/PDF string generation escapes text for generated file formats.
- Export generation uses browser Blob, object URL, and download APIs only; no network/upload path was added.
- Image export is implemented as an SVG image file rather than raster PNG to keep the packet dependency-free and deterministic.

## BUILD-007 Implementation Summary

- Implemented the Card Library as a secondary surface reachable from primary navigation while keeping Start Reading as the home surface call to action.
- Added local browse/search over the existing 78-card placeholder tarot data by card name, arcana metadata, suit/rank metadata, and keywords.
- Added card detail presentation with keywords, beginner-level upright meaning, beginner-level reversed meaning, placeholder card presentation, and explicit artwork provenance messaging.
- Added friendly empty-state copy for unmatched searches and live result counts for search feedback.
- Updated component tests and browser smoke coverage for library browse, search, detail selection, empty results, XSS-like search text rendering, no-fetch behavior, and no real artwork guard.

## BUILD-007 Constraints Maintained

- No real card artwork, remote card data, backend, authentication, analytics, AI, payment, cloud deployment, or network calls were introduced.
- Search input is rendered through React text/value bindings only; no raw HTML rendering path was added.
- Card meanings are derived from existing basic domain keywords and are presented honestly as simple beginner prompts rather than deep authored content or predictions.

## BUILD-008 Implementation Summary

- Added persistent Default Motion and Reduced Motion preference storage under an AuraTarot-owned localStorage key.
- Added a short first-time privacy notice that can be dismissed and remembers dismissal in browser-local app-owned storage.
- Expanded the Preferences surface with local-only/current-device storage limitations, motion controls, local data status, and clear app-owned local data access.
- Added conservative web app metadata through `index.html`, `public/manifest.webmanifest`, and a placeholder SVG icon.
- Documented the no-service-worker decision in `docs/pwa-posture.md` to avoid stale app-shell risk and private/generated content caching.
- Updated component tests for persisted motion preference, notice dismissal, privacy copy, no service-worker registration, and no startup network calls.

## BUILD-008 Constraints Maintained

- No analytics, telemetry, remote fonts/assets, backend, authentication, AI, payment, cloud sync, deployment, service-worker registration, or real artwork was introduced.
- Saved readings, journal notes, export blobs, reading topics, intentions, and generated reading content are not cached by a service worker in this build.
- Preference and notice state use local app-owned browser storage only and remain clearable through the app-owned local data flow.

## BUILD-FIX-001 Implementation Summary

- Added a reusable modal dialog wrapper for the active confirmation and export dialogs.
- Dialog opening now moves focus into the dialog, Tab and Shift+Tab cycle within the dialog controls, Escape follows the safe cancel/close path, and closing restores focus to the invoking control when it is still available.
- Added regression coverage for export preview, unsaved-leave warning, delete confirmation, and clear local data confirmation keyboard focus behavior.
- Added a 2000-character journal note cap, textarea `maxLength`, character count, and user-safe limit guidance while preserving local save and export behavior.
- Replaced `latest` package specifiers with explicit versions matching the current lockfile resolutions.

## BUILD-FIX-001 Constraints Maintained

- No backend, authentication, analytics, AI, payment, cloud deployment, network behavior, real artwork, export format changes, or persistence refactor was introduced.
- Dependency changes only pin existing dependency names and current lockfile-resolved versions; no new packages were added.
