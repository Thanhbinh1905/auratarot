# Static Deployment and Rollback Runbook

## Purpose

This runbook defines the approved deployment posture for AuraTarot on a generic static hosting provider. It is a deployment preparation document only. No deployment was performed as part of creating this runbook.

## Approved Operational Posture

AuraTarot is approved only as a client-side static application published from the build output directory. The deployment artifact must contain the generated `dist/` contents only.

The approved posture excludes:

- Service workers and offline runtime caches.
- Analytics, telemetry, tracking pixels, or session replay.
- Backend services, server-side rendering, cloud sync, AI calls, payments, or database integrations.
- Real artwork or third-party production creative assets unless separately reviewed and approved.

The current PWA posture is metadata-only: a web app manifest and static icons may be served, but no service worker may be registered.

## Prerequisites

Before preparing a release artifact, confirm the following:

- A deployment target has been selected and approved separately.
- The working tree is clean or all local changes are intentional and reviewed.
- The release commit or source archive is known and recorded.
- Node.js and Corepack are available in the local or CI build environment.
- The repository includes `package.json` and `pnpm-lock.yaml`.
- The package manager is resolved through Corepack using the package manager declared in `package.json`.

## Local Build Procedure

Run these commands from the repository root:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm run build
```

Optional local verification commands before artifact publication:

```bash
corepack pnpm run lint
corepack pnpm run typecheck
corepack pnpm run test
```

The expected build artifact is `dist/`. Do not publish source files, `node_modules/`, test artifacts, local configuration, environment files, or repository metadata.

## Static Host Requirements

The static host must support:

- Publishing the generated `dist/` directory as the web root.
- HTTPS for all public traffic.
- Single-page application fallback from unknown application routes to `index.html`, if deep links are expected.
- Configurable cache headers for HTML, manifest, icon, and hashed asset files.
- Retention of previous immutable releases or artifacts for rollback.
- A way to inspect HTTP status codes and response headers after deployment.

Do not configure a backend runtime, serverless functions, edge functions, analytics integration, or cloud storage sync unless a new approval explicitly expands scope.

## Publish Directory

Publish only:

```text
dist/
```

Do not publish:

- Repository root files outside `dist/`.
- Source directories such as `src/`.
- Dependency directories such as `node_modules/`.
- Local files such as `.env`, `.env.*`, editor settings, logs, screenshots, or test reports.
- Cloud credentials, API tokens, private keys, or generated secret material.

## Cache Header Guidance

Use conservative cache settings for entry points and immutable caching for hashed assets.

Recommended headers:

| Path Pattern | Cache Policy | Rationale |
| --- | --- | --- |
| `/index.html` | `Cache-Control: no-cache` or `Cache-Control: max-age=0, must-revalidate` | Ensures users discover the latest asset references after a release. |
| `/manifest.webmanifest` or `/manifest.json` | `Cache-Control: no-cache` or `Cache-Control: max-age=0, must-revalidate` | Prevents stale PWA metadata from persisting across updates. |
| `/assets/*` with content hashes | `Cache-Control: public, max-age=31536000, immutable` | Hashed files are safe to cache for a long duration because file names change when content changes. |
| Static icons without content hashes | `Cache-Control: public, max-age=86400` or shorter | Allows browser caching while limiting stale icon risk. |

Do not use broad immutable caching for `index.html` or the manifest. Do not add service-worker cache rules.

## Pre-Deployment Checklist

Complete this checklist before any deployment approval or host-specific configuration change:

- [ ] Deployment target and release method are approved.
- [ ] Release source commit or archive is recorded.
- [ ] `corepack pnpm install --frozen-lockfile` succeeds.
- [ ] `corepack pnpm run build` succeeds.
- [ ] Optional verification commands have been run or explicitly waived.
- [ ] Artifact contains `dist/` output only.
- [ ] No `.env`, secret, credential, token, key, local log, or unrelated generated file is included in the artifact.
- [ ] No service worker registration is present or enabled.
- [ ] No analytics, telemetry, backend, cloud sync, AI, payment, or remote tracking integration is configured.
- [ ] Cache headers are configured according to this runbook.
- [ ] Previous release artifact remains available for rollback.
- [ ] Rollback operator, approval path, and expected rollback time are known.

## Deployment Procedure Template

Use this template only after deployment approval is granted for a specific host:

1. Build from the approved release source using the local build procedure.
2. Capture the release identifier, build timestamp, and artifact checksum if available.
3. Upload or promote the generated `dist/` artifact to the approved static host.
4. Apply cache headers for entry points, manifest files, icons, and hashed assets.
5. Confirm the host serves the app over HTTPS.
6. Run post-deployment smoke and canary checks.
7. Keep the previous release available until the canary window completes.

This generic runbook does not authorize deployment and does not select a host.

## Post-Deployment Smoke Checks

After an approved deployment, verify:

- The root URL returns HTTP 200 over HTTPS.
- `index.html` is served with a short or revalidating cache policy.
- Hashed assets under the built asset directory return HTTP 200 and use immutable long-lived caching.
- The manifest returns HTTP 200 and uses a short or revalidating cache policy.
- Browser console has no blocking runtime errors on initial load.
- Main app navigation and primary reading flow load without network calls outside the approved static asset set.
- Refreshing a deep link works if single-page application fallback was approved and configured.
- No service worker is registered in the browser application state.
- No analytics, telemetry, backend, cloud sync, AI, payment, or tracking requests are observed.

## Canary Monitoring

During the initial canary window, monitor for:

- HTTP 4xx or 5xx spikes from the static host.
- Failed asset loads, especially JavaScript, CSS, manifest, and icon files.
- Blank screen, hydration, or runtime initialization failures.
- Unexpected network calls to unapproved domains.
- Reports of stale UI caused by incorrect `index.html` or manifest caching.
- Browser-specific failures on the supported desktop and mobile browser set.

Recommended canary duration is at least 15 to 30 minutes for a low-traffic personal static app, or longer if real user traffic is limited and manual verification is required.

## Rollback Procedure

Rollback must use an immutable previous artifact or release. Do not rebuild an unknown prior state during an incident unless the original artifact is unavailable and a new approval accepts that risk.

Rollback steps:

1. Stop further release changes and identify the active release identifier.
2. Confirm the previous known-good `dist/` artifact or host release is available.
3. Restore or promote the previous artifact through the host-approved rollback mechanism.
4. Preserve short or revalidating cache headers for `index.html` and the manifest so clients can discover the rollback quickly.
5. Verify the root URL, assets, manifest, and primary app flow after rollback.
6. Confirm no service worker is present; if a future unauthorized service worker is found, stop and require security and ops review before further release activity.
7. Record the rollback time, restored release identifier, observed symptoms, and follow-up owner.

## Rollback Stop Conditions

Stop rollback and request new approval if any of the following are true:

- The previous artifact cannot be identified or verified.
- The host requires new production infrastructure configuration outside the approved static-host posture.
- Secrets, credentials, environment files, or private data are found in an artifact.
- The incident involves unauthorized analytics, service worker behavior, backend calls, cloud sync, AI, payment, or third-party tracking.
- The rollback requires destructive deletion, production data mutation, or credential rotation.

## Approval Stop Conditions

New approval is required before any of the following changes:

- Selecting or changing the deployment target.
- Performing an actual deployment, promotion, rollback, or production mutation.
- Adding analytics, telemetry, tracking, or session replay.
- Adding a service worker, offline cache, or cache-first runtime strategy.
- Adding backend services, serverless functions, cloud sync, AI integrations, payment flows, or database storage.
- Adding real artwork, third-party production creative assets, or externally hosted media.
- Publishing anything other than generated `dist/` contents.
- Reading or using secrets, cloud credentials, deployment tokens, or environment files.

## Incident Notes Template

Use this template after an approved deployment or rollback:

```text
Release identifier:
Deployment target:
Artifact source:
Deployment time:
Canary start time:
Canary end time:
Smoke check result:
Unexpected network calls observed:
Service worker state:
Rollback artifact retained:
Operator:
Approver:
Follow-up items:
```

## Main Session Change Trace

- Created `docs/deployment-runbook.md` as a static-hosting deployment and rollback runbook.
- Encoded the approved posture of publishing `dist/` only from a frozen-lockfile Corepack pnpm build.
- Documented metadata-only PWA handling with no service worker, no offline runtime cache, and no analytics or telemetry.
- Added cache header guidance for `index.html`, manifest files, hashed assets, and icons.
- Added pre-deployment, smoke, canary, rollback, and approval stop-condition procedures.
- No deployment, cloud access, secret access, host-specific configuration mutation, analytics addition, service worker addition, backend addition, or destructive operation was performed.
