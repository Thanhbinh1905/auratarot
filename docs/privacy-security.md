# Privacy and Security Notes

## Summary

AuraTarot is currently a local-only browser application. The delivered MVP is designed for private reflection without account creation, backend storage, analytics, AI calls, payment processing, or deployment.

## Data Storage

- Saved readings and journal notes are stored in browser-local storage on the current device.
- Motion preference and dismissed notices are also stored locally.
- Data does not sync across devices or browsers.
- Clearing browser storage can remove saved readings and preferences.

## Network and Service Posture

- No backend API, cloud sync, authentication, analytics, telemetry, AI provider, or payment integration is introduced.
- No service worker is registered.
- No offline cache is implemented.
- The web app manifest is metadata-only and references local placeholder icon assets.

## Export Privacy

Exports are generated client-side. Users should treat exported files as private because they may include the reading topic, question, selected cards, interpretation text, and journal note. The export preview includes a control to exclude the journal note.

## Asset Provenance

Local real tarot card fronts are included under `public/cards/rws-roses-lilies/`. The asset set is documented in `docs/assets/rws-roses-lilies-provenance.json`, which records the Wikimedia Commons Roses and Lilies category URL, a sample source file URL, public-domain-tagged Commons provenance evidence, file count, and SHA-256 checksums for all 78 local front images.

The provenance manifest is not legal approval or a legal opinion. Legal review is recommended before commercial release or redistribution decisions. No separate card-back image exists; the application uses the existing CSS-rendered local card back.

Card fronts are served from local repository files only. No remote runtime artwork loading is introduced.

## Operational Boundaries

- No deployment was performed for this delivery.
- No production, cloud, backend, authentication, analytics, AI, or payment systems were configured.
- Future work that adds external services must receive separate security and operations review before release.
