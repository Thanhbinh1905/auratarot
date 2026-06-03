## Summary

Implemented `FULLPAGE-READING-001` by moving active reading steps into a dedicated full-page ritual surface with minimal surrounding chrome.

## Scope

- In scope: React UI state/layout refactor, CSS surface sizing, unit/E2E selector updates, local verification.
- Out of scope: deployment, backend/auth/analytics/AI/payment changes, remote assets, new dependencies, real asset import.

## Changes

- Added a dedicated ritual surface state so starting or resuming a reading opens a full-page reading table rather than embedding the flow in the sanctuary card layout.
- Added a safe exit path back to the sanctuary that preserves in-progress reading state and exposes a resume action.
- Kept Journal access secondary in the active ritual header so saved-reading workflows remain reachable while primary navigation and the side panel are removed from the active reading surface.
- Expanded styles for the full-page ritual stage, larger tarot table area, and minimal ritual actions.
- Updated unit and E2E expectations for the dedicated ritual surface.

## Evidence

- Focused RED: new dedicated-surface unit test failed before implementation because no named full-page ritual main region existed.
- Focused GREEN: dedicated-surface unit test passed after implementation.
- Full unit suite: `npm test` passed after implementation.

## Security and Privacy Notes

- No secrets or environment files were read.
- No backend, network, analytics, AI, payment, deployment, dependency, or asset-import scope was added.
- Local-only reading, save, and export behavior remains in the existing browser-local flow.

## Handoff

Run the remaining requested verification commands: typecheck, lint, coverage, build, and E2E.
