# Implementation Trace

## Summary

Added provenance documentation for the local Rider-Waite-Smith Roses and Lilies tarot card fronts and updated stale project documentation to reflect the current local asset posture.

## Scope

- Added `docs/assets/rws-roses-lilies-provenance.json` with the source category URL, sample source file URL, public-domain-tagged Commons provenance summary, legal caveat, local runtime-loading note, card-back note, file count, and per-file SHA-256 checksums for all 78 local card fronts.
- Updated README, implementation summary, and privacy/security notes to state that local real tarot fronts are included and provenance-tagged.
- Preserved the existing local-only posture: no backend, cloud, deploy, external download, remote runtime asset loading, analytics, AI, payment, or legal approval claim was added.

## Evidence

- Local asset directory inspected: `public/cards/rws-roses-lilies/` contains 78 `.jpg` files.
- Checksums were generated locally with Node.js crypto over the existing repository files.
- The manifest references the previously recommended Wikimedia Commons source category and sample file URL.

## Risks and Follow-Ups

- The manifest records provenance evidence only and is not legal approval. Legal review remains recommended before commercial release or redistribution decisions.
- No separate card-back image exists; the application continues to use the CSS-rendered local card back.

## Verification

- Manifest validation passed: 78 local `.jpg` files were matched to 78 manifest entries with SHA-256 checksums recomputed from local files.
- Documentation stale-claim scan passed for the remediated claims: no remaining Markdown matches for the prior statements that real tarot artwork is absent, future-only, or intentionally deferred.
- Project checks passed: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
