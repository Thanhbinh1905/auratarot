## Summary

Implemented the BUILD-RITUAL-001 ritual tarot reading redesign for the local AuraTarot app.

## Scope

- Replaced the button-only reading ritual with a visible tarot table, stacked deck, cut piles, face-down fan selection, hidden spread cards, and reveal progression.
- Added local sealed deck semantics: shuffle seals order once per ritual, cut rotates that sealed order, draw consumes selected cards from the cut order, and reveal does not alter identity or orientation.
- Added progressive interpretation layers after reveal: summary first, then deeper meaning, then practical guidance.
- Preserved existing spread options, local-only storage, placeholder card data, and no remote assets.

## Implementation Trace

- `src/domain/tarot/index.ts`: added sealed deck, rotation, and draw-from-order helpers; allowed reading sessions to consume a supplied sealed/cut order and selected face-down card IDs.
- `src/App.tsx`: added ritual state for sealed deck order, cut deck order, selected fan cards, and progressive meaning layers; rendered table/deck/cut/fan/face-down/reveal stages.
- `src/styles.css`: added CSS-only table, deck stack, pile, fan, card back/front, flip, and reduced-motion-friendly styling.
- `src/domain/tarot/tarot.test.ts`: added sealed/cut/draw/reveal identity stability coverage.
- `src/App.test.tsx`: updated the reading flow and added ritual table, face-down, reduced-motion, and progressive reveal coverage.
- `e2e/smoke.spec.ts`: updated smoke flow to exercise the new ritual interaction path.

## Decisions

- No animation or motion dependency was added; the implementation uses React state and CSS transforms/transitions only.
- Placeholder/procedural card backs and fronts remain symbolic; no copyrighted tarot artwork or remote assets were introduced.
- The sealed deck is held in component state for the current local ritual session and reset only when a new ritual begins or the reading flow resets.

## Verification

- Typecheck passed with `npm run typecheck`.
- Targeted unit/app tests passed with `npm run test -- src/domain/tarot/tarot.test.ts src/App.test.tsx`.
- Lint passed with `npm run lint`.
- Coverage passed with `npm run test:coverage` at 92.17% statements, 82.21% branches, 94.47% functions, and 92.15% lines.
- Production build passed with `npm run build`.
- Playwright e2e passed with `npm run test:e2e`.

## Risks and Follow-up

- Visual quality should receive a browser review because CSS-only deck/fan motion is difficult to fully validate in unit tests.

## Remediation Update: BUILD-RITUAL-FIX-001-R1

### Summary

Implemented the Phase 6 ritual UI remediation for individual card reveal and tactile fan/deal refinements.

### Scope

- Replaced the reveal-all result mount with per-card reveal controls in the reading result stage.
- Preserved sealed deck semantics: card identity and orientation are fixed during draw and reveal only records per-card revealed state.
- Added stateful back-to-front flip presentation for normal motion and static/crossfade-oriented reveal handling for reduced motion.
- Strengthened fan layout with per-card arc variables, selected-card lift, and staged face-down deal cues.
- Kept all assets symbolic and local; no dependencies, network assets, backend, deploy, or storage refactor were introduced.

### Implementation Trace

- `src/App.tsx`: added `revealedCardIds`, per-card reveal buttons, all-cards-revealed completion gating, and hidden face-down cards before individual activation.
- `src/styles.css`: added fan arc/overlap transforms, selected lift/deal animation, flip state styling, and ritual-specific reduced-motion overrides.
- `src/App.test.tsx`: updated ritual flows for individual reveal and added reduced-motion reveal-state coverage.
- `e2e/smoke.spec.ts`: updated the smoke ritual to activate an individual reveal card button.

### Verification

- `npm run test -- src/App.test.tsx` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed.
- `npm run test:coverage` passed: 91.78% statements, 82.44% branches, 93.41% functions, 91.92% lines.
- `npm run build` passed.
- `npm run test:e2e` passed.

### Risks and Follow-up

- Browser/UI re-review should confirm the subjective physicality of CSS-only fan arc, selected lift, deal cues, and flip feel.

## Implementation Update: FULLPAGE-RITUAL-IMMERSION-001

### Summary

Implemented the full-page ritual immersion pass and wired the locally installed card face assets into the reading and library UI.

### Asset Inspection

- Found `public/cards/rws-roses-lilies/` with 78 `.jpg` card face files.
- Found no separate local card-back image asset; the app continues to use the existing local CSS card-back pattern.
- Found no asset manifest or provenance document in the card directory during local inspection.
- Found `docs/assets/` present with 0 files.

### Scope

- Wired all 78 tarot card metadata entries to local `/cards/rws-roses-lilies/*.jpg` paths derived from card names.
- Replaced placeholder face rendering with local `<img>` rendering for revealed reading cards and the card library while preserving a CSS-only back for face-down cards.
- Expanded the dedicated reading surface into a full-viewport ritual table that suppresses the standard app chrome and makes deck/spread/meaning areas the primary composition.
- Kept safe exit and resume behavior: exiting the ritual surface returns to the sanctuary without clearing in-progress reading state.
- Preserved sealed deck semantics: shuffle seals once, cut rotates, draw consumes selected cards from fixed order, reveal only toggles visibility.

### Implementation Trace

- `src/domain/tarot/index.ts`: changed card asset metadata from symbolic placeholder references to local installed card image paths and updated asset policy copy.
- `src/App.tsx`: added reusable card-face rendering, updated library provenance copy, rendered local card images in library/revealed cards, and added active-table classing for the dedicated ritual surface.
- `src/styles.css`: removed app padding during active ritual, expanded the full-page ritual background/stage/table, added local card image styling, larger deck/fan/spread compositions, sticky meaning/journal panel treatment, and responsive fallbacks.
- `src/domain/tarot/tarot.test.ts`: updated deck asset expectations to require local installed `.jpg` mappings.
- `src/App.test.tsx`: updated library and XSS tests for local asset rendering and no remote fetch calls.
- `e2e/smoke.spec.ts`: updated library smoke coverage for local card image rendering.

### Verification

- `pnpm` was unavailable in the environment.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed: 40 tests across 2 files.
- `npm run test:coverage` passed: 91.88% statements, 81.59% branches, 93.6% functions, 92.02% lines.
- `npm run build` passed.
- `npm run test:e2e` passed: 2 Playwright tests.

### Risks and Follow-up

- A human browser review should confirm the subjective full-page ritual composition and card image fit across target screen sizes.
- No separate local card-back image was found; if one is installed later, it can replace the CSS card-back pattern without changing sealed deck semantics.
