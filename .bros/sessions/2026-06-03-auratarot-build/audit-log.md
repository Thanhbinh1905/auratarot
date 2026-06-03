# Audit Log

## 2026-06-03

- Verified task packet fields and scope before implementation.
- Confirmed target directory initially contained only the `docs` directory by local directory inspection.
- Added project scaffold and local quality harness files.
- Ran dependency installation with Corepack-managed pnpm because a direct `pnpm` executable was not available.
- Ran typecheck, lint, unit tests, coverage, and static build successfully.
- Ran Playwright browser smoke test successfully after installing the local Chromium browser package required by Playwright.
- Validated BUILD-002 packet scope before implementation and confirmed required UI and Explorer packets were referenced by the task packet.
- Updated local app shell, design tokens, accessibility-oriented controls, unit/component tests, and browser smoke test within the approved frontend scope.
- Verification attempted for BUILD-002: typecheck, lint, unit tests, static build, and Playwright smoke test.

## Data Handling

- Trusted gate details and untrusted repository context are recorded separately.
- No raw secrets, tokens, credentials, environment values, or sensitive logs are stored in these records.

## BUILD-FIX-001 Audit Entry

- Verified the remediation packet scope before implementation: assigned owner, Phase 6 remediation priority, required UI and Explorer packet references, gate status, allowed local commands, and explicit out-of-scope items were present.
- Added regression tests first for modal focus containment/restoration and journal note length limiting; observed expected failures before implementation.
- Implemented reusable dialog focus management, journal note length limiting and guidance copy, and explicit dependency specifiers matching the lockfile-resolved versions.
- Updated neutral remediation records without storing secrets, environment values, credentials, or sensitive logs.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright end-to-end tests. Root package files were checked for remaining `latest` specifiers with no matches.
- `git status --short` was attempted for read-only inspection; the target directory is not currently a git repository.

## BUILD-003 Audit Entry

- Verified approved task packet scope before implementation: assigned owner, Phase 5 approval, placeholder-only asset constraint, pure domain scope, and required Explorer packet references were present.
- Added tests before implementation and observed an expected RED state caused by missing tarot domain module resolution.
- Implemented tarot domain and placeholder deck metadata without adding real images or network/runtime adapters.
- Ran local verification commands: typecheck, lint, unit tests, coverage, and build.
- Coverage completed successfully after adding an undersized-deck rejection/default path names test; final global branch coverage exceeded the configured threshold.
- No secret, environment, credential, or production deployment surface was read or modified.

## BUILD-004 Audit Entry

- Verified the approved BUILD-004 task packet scope before implementation: assigned owner, Phase 5 approval, required UI and Explorer packet references, security controls, QA controls, allowed commands, and explicit out-of-scope items were present.
- Added reading-flow tests first and observed the expected RED state caused by missing reading-flow UI behavior.
- Implemented the reading ritual UI and domain integration within the approved frontend scope.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright smoke.
- `git status --short` was attempted for read-only inspection; the target directory is not currently a git repository.
- No secret, environment, credential, deployment, backend, persistence, export, or network behavior was introduced.

## BUILD-005 Audit Entry

- Verified the approved BUILD-005 task packet scope before implementation: assigned owner, Phase 5 approval, required UI and Explorer packet references, Security and QA controls, allowed local command classes, and explicit out-of-scope items were present.
- Added persistence/journal tests first and observed an expected RED state caused by missing save, journal, delete, clear-local-data, storage-error, and unsaved-leave behavior.
- Implemented manual-save local persistence, journal list/detail, delete and clear confirmations, storage recovery/error copy, and unsaved-leave reminder within the approved frontend/client-only scope.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright smoke. Coverage remained above the configured thresholds.
- No secret, environment, credential, deployment, backend, analytics, AI, payment, network sync, real artwork, or export behavior was introduced.

## BUILD-006 Audit Entry

- Verified the approved BUILD-006 task packet scope before implementation: assigned owner, Phase 5 approval, required UI and Explorer packet references, Security/QA/Ops controls, allowed local command classes, and explicit out-of-scope items were present.
- Added export tests first and observed an expected RED state caused by the existing disabled export placeholder and missing saved-reading export control.
- Implemented export preview, visible default note inclusion, note exclusion, privacy reminder, client-side PDF/SVG image Blob generation, local download handling, and recoverable error messaging within the approved frontend scope.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright smoke. Coverage remained above configured thresholds.
- No secret, environment, credential, deployment, backend, analytics, AI, payment, remote export service, network upload path, real artwork, or service worker behavior was introduced.

## BUILD-007 Audit Entry

- Verified the approved BUILD-007 task packet scope before implementation: assigned owner, Phase 5 approval, required UI and Explorer packet references, Security/QA controls, allowed local command classes, and explicit out-of-scope items were present.
- Added Card Library component tests first and observed an expected RED state caused by missing library UI/search/detail behavior.
- Implemented local-only card library browse/search/detail behavior using existing tarot domain data and symbolic placeholder card presentation.
- Added browser smoke coverage for card library search/detail and XSS-like search text safety.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright smoke. Coverage remained above configured thresholds.
- `git status --short` was attempted for read-only inspection; the target directory is not currently a git repository.
- No secret, environment, credential, deployment, backend, analytics, AI, payment, remote card data, network call, or real artwork behavior was introduced.

## BUILD-008 Audit Entry

- Verified the approved BUILD-008 task packet scope before implementation: assigned owner, Phase 5 approval, required UI and Explorer packet references, Security/QA/Ops controls, allowed local command classes, and explicit out-of-scope items were present.
- Added preference/privacy/PWA tests first and observed an expected RED state caused by missing persisted motion preference, first-time notice, preferences privacy copy, and no-service-worker assertions.
- Implemented local-only persistent motion preference, dismissible privacy notice, preferences privacy/data-control copy, metadata-only PWA posture, and documented no-service-worker rationale within the approved frontend/static scope.
- Ran local verification commands: typecheck, lint, unit tests, coverage, build, and Playwright smoke. Coverage remained above configured thresholds.
- Searched the app/static surfaces for service-worker registration, analytics/telemetry/network startup indicators, and remote font imports; no implementation path was found beyond test assertions and user-facing no-analytics copy.
- `git status --short` was attempted for read-only inspection; the target directory is not currently a git repository.
- No secret, environment, credential, deployment, backend, analytics, telemetry, AI, payment, remote asset, cloud sync, real artwork, or service-worker behavior was introduced.
