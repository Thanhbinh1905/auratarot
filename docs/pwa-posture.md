# PWA and Cache Posture

## Summary

AuraTarot uses conservative static app metadata only. This build adds a web app manifest and local placeholder SVG icon so static hosts and browsers can identify the app.

## Service Worker Decision

No service worker is registered in this build. Offline caching is deferred because a broad or stale service worker could preserve broken app versions or accidentally cache private/generated content.

## Private Content Rule

Saved readings, journal notes, export blobs, reading topics, intentions, and generated reading content must not be stored in a service-worker cache. If a future task enables service-worker caching, it must be static app-shell/assets only and must exclude local storage records, blobs, and generated user content.

## Network Posture

No analytics, telemetry, remote fonts, cloud sync, backend, AI, or payment calls are introduced by this metadata-only posture.
