# Decisions

## Client Framework

- Decision: use React with TypeScript and Vite.
- Rationale: matches approved architecture context and supports a static local-first client foundation.

## Package Manager

- Decision: use pnpm.
- Rationale: approved task requires pnpm lockfile and scripts.

## Testing Harness

- Decision: configure Vitest, React Testing Library, jsdom, and Playwright baseline.
- Rationale: satisfies unit/component smoke testing now and prepares for browser verification in later UI packets.

## Product Surface

- Decision: include only a truthful scaffold shell.
- Rationale: full tarot flows and visual product surfaces are outside this task.
