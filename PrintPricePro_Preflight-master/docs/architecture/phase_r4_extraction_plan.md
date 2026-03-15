# Phase R4 — Extraction Plan

## 1. R4.1 — Audit & Verification
*   [x] Inspect residual surfaces (`connect.js`, `reservations.js`, `printerAuth.js`).
*   [x] Map dependencies and downstream services.

## 2. R4.2 — Federation Surface Extraction (Printer Auth & Connect)
*   **Action A**: Move `middleware/printerAuth.js` to `ppos-core-platform/src/middleware/`.
*   **Action B**: Move `routes/connect.js` to `ppos-control-plane/src/routes/`.
*   **Action C**: Create compatibility bridges in Product App for both.
*   **Validation**: Ensure `server.js` boots and correctly mounts the bridged routers.

## 3. R4.3 — Reservation Surface Extraction
*   **Action A**: Move `routes/reservations.js` to `ppos-core-platform/src/routes/`.
*   **Action B**: Create compatibility bridge in Product App.
*   **Validation**: Manual check of route accessibility.

## 4. R4.4 — Cleanup & Doc
*   [ ] Update `migration_log.md`.
*   [ ] Verify boundary integrity.

## Rollback Strategy
If a bridge fails: 
1. Restore the original file from the destination repo back to the Product App.
2. Update the `require` paths in `server.js` to point back to the local files.
