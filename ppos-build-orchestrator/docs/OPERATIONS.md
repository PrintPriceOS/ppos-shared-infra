# Operational Guide

## Getting Started
1. Run `pnpm install` at the root.
2. Build the packages: `pnpm build`.
3. Verify the scaffold: `node scripts/verify/verify-scaffold.mjs`.

## Local Development
- Start the Operator Dashboard: `node scripts/dev/run-local-dashboard.mjs`.
- Start the CLI: `node scripts/dev/run-local-cli.mjs`.

## Running Build Programs
Use the CLI to resolve and bootstrap programs:
```bash
ppos-build resolve --profile foundation_bootstrap
ppos-build bootstrap
```
