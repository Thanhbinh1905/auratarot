# Handoff

## Current State

The repository now has a local-first frontend scaffold and quality harness ready for future feature work.

## Next Recommended Gates

- Run feature-specific UI packets before implementing product surfaces.
- Require security review for any future user-generated content rendering, persistence, import/export, or network behavior.
- Require QA review for reading flows, journal persistence, accessibility, and browser test coverage.

## Follow-Up Notes

- Browser binaries may need local installation before Playwright smoke tests are run.
- Coverage thresholds are intentionally enabled to keep future code covered as the scaffold grows.

## BUILD-003 Handoff Update

- Tarot domain/content model is implemented in `src/domain/tarot/index.ts` with unit coverage in `src/domain/tarot/tarot.test.ts`.
- The deck is complete for 78 card identities and uses symbolic placeholder asset metadata only.
- Interpretation content is intentionally reflective and non-predictive; richer per-card authored prose can be expanded in a later approved content task.
- Recommended next gate: QA review of deterministic domain behavior and placeholder asset compliance before UI integration consumes these modules.

## BUILD-004 Handoff Update

- The user can now complete a local reading from the Sanctuary start action through topic/intention, spread selection, ritual progression, revealed cards, interpretation layers, and a journal draft area.
- All approved topics and spreads are available. Decision Maker supports custom path names with defaults.
- Revealed cards use placeholder symbolic presentation and show position, card name, upright/reversed orientation, keywords, short summary, deeper meaning, and a practical next step.
- Journal save/export remain disabled deferred actions; no persistence was added.
- Recommended next gate: QA review of the UI flow, keyboard/focus behavior, reduced-motion path, and wording tone before any persistence/export or artwork task.

## BUILD-005 Handoff Update

- Completed readings can now be manually saved with an optional journal note into app-owned browser storage.
- The Journal surface now shows local-only limitation copy, an empty state, saved-reading list/detail views, delete confirmation, and a clear app-owned local data confirmation.
- Unsaved completed readings and unsaved note drafts prompt before leaving the reading surface.
- Storage corruption and storage write failures show user-safe messages; corrupt existing data can be overwritten by a later successful save.
- Export remains a disabled placeholder and no remote storage or network sync was added.
- Recommended next gate: QA review of persistence behavior across browsers/private mode, modal focus behavior, and storage limitation copy before export, PWA caching, or artwork tasks.

## BUILD-006 Handoff Update

- Completed and saved readings can now open a local export preview, include or exclude journal notes, and download client-generated PDF or SVG image files.
- Export privacy copy warns that topic, question, and note may be included; generation remains browser-local.
- Recommended next gate: QA review of export file content, browser compatibility, and modal focus behavior before any sharing, cloud, or richer export work.

## BUILD-007 Handoff Update

- The Card Library surface now supports browse, search by name/keyword, selected card detail, beginner-level upright/reversed meaning, keywords, and clear placeholder artwork provenance copy.
- Library behavior uses only existing local tarot domain data and symbolic placeholder asset metadata.
- Recommended next gate: QA review of card library accessibility, search behavior, and consistency with revealed reading cards before any authored-content expansion or real artwork review.

## BUILD-008 Handoff Update

- Preferences now persist Default Motion or Reduced Motion in browser-local app-owned storage and expose local-only privacy/data controls.
- A short first-time privacy notice appears on first load and can be dismissed locally.
- Static app metadata and a placeholder SVG icon are present; service-worker caching is intentionally deferred and documented in `docs/pwa-posture.md`.
- Recommended next gate: QA review of privacy notice copy, motion persistence across target browsers/private mode, and install metadata behavior before any service-worker or offline-cache task.

## BUILD-FIX-001 Handoff Update

- Modal dialogs now use shared focus management for initial focus, Tab/Shift+Tab containment, Escape cancel/close behavior, and focus restoration.
- Journal notes are capped at 2000 characters with visible character-count guidance.
- Dependency specifiers are pinned to the versions already resolved in the current lockfile.
- Recommended next gate: rerun QA accessibility review and final security follow-up verification before release/deploy consideration.
