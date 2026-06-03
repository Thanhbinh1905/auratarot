# AuraTarot

AuraTarot is a local-first React/Vite tarot reflection app. It provides a private reading flow, saved journal entries, export previews, a card library, and privacy/preferences surfaces without accounts, backend services, analytics, AI calls, payments, or deployment configuration.

## Features

- Guided reading flow with Daily Guidance, Crossroads, and Decision Maker spreads.
- Card selection, reveal states, upright/reversed orientation, and contextual reading text.
- Browser-local journal persistence for saved readings and notes.
- Privacy-aware export preview with options to include or exclude journal notes.
- Card library for browsing local Rider-Waite-Smith Roses and Lilies card fronts and card information.
- Preferences and privacy information, including reduced-motion support and local-storage notices.
- Metadata-only PWA posture through `public/manifest.webmanifest` and placeholder SVG icon assets.

## Local Setup

Use Corepack with the pinned pnpm version from `package.json`.

```bash
corepack enable
corepack pnpm install
corepack pnpm dev
```

The development server is provided by Vite. The app runs locally only unless a separate hosting target is added and approved.

## Verification

Run the local checks from the project root:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Optional end-to-end verification:

```bash
corepack pnpm test:e2e
```

No production or cloud deployment was performed for this delivery.

## Privacy and Security Posture

- Saved readings, journal notes, preferences, and dismissed notices are stored in the current browser on the current device using browser storage.
- The app does not create accounts, call a backend, send analytics or telemetry, invoke AI services, or process payments.
- Exports are generated client-side. Exported files may contain the user's topic, question, reading, and journal note if the note is included.
- The PWA posture is metadata-only. No service worker or offline cache is registered in this build.
- Local real tarot card fronts are included under `public/cards/rws-roses-lilies/` and documented in `docs/assets/rws-roses-lilies-provenance.json`. The manifest records provenance evidence and SHA-256 checksums; it is not legal approval. Legal review is recommended before commercial release or redistribution decisions.
- Card fronts are loaded from local repository files only; no remote runtime artwork loading is used.

## Accessibility and Motion

- The implementation includes keyboard-accessible interaction paths, semantic dialog behavior, focus restoration checks, and ARIA state coverage in tests.
- Reduced motion can be selected in preferences and persists in browser-local storage.
- Motion should remain supportive rather than required; future interactive additions should preserve keyboard and reduced-motion paths.

## Known Limitations

- This directory is not currently a git repository.
- Card fronts use the local provenance-tagged Roses and Lilies asset set. No separate card-back image exists; the app uses the existing CSS-rendered local card back.
- Image export is SVG-based rather than raster PNG.
- Journal data is browser-local and is not synced across devices or browsers.
- There is no service worker, offline cache, deploy target, backend, authentication, analytics, AI, or payment integration.

## Follow-Ups

- Complete legal review for the local Roses and Lilies tarot assets before any commercial release or redistribution decision.
- Decide whether a deployment target is needed and document the approved hosting posture before deploying.
- If offline support is added, restrict service-worker caching to static app-shell assets and exclude private/generated content.
- Consider improving export options if raster PNG output is required.

## Project References

- Product requirements: [`docs/PRD.md`](docs/PRD.md)
- PWA and cache posture: [`docs/pwa-posture.md`](docs/pwa-posture.md)
- Implementation summary: [`docs/implementation-summary.md`](docs/implementation-summary.md)
- Privacy and security notes: [`docs/privacy-security.md`](docs/privacy-security.md)
- Tarot asset provenance: [`docs/assets/rws-roses-lilies-provenance.json`](docs/assets/rws-roses-lilies-provenance.json)
