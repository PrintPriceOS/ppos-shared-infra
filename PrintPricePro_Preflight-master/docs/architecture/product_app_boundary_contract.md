# Product App Boundary Contract

## 1. Allowed Responsibilities
The **Product App** (`preflight.printprice.pro`) is a client of the PrintPrice OS. It is strictly limited to:
- **Frontend UI**: React components, hooks, and pages serving the end-user.
- **Job Submission**: Buffering user uploads and sending them to the OS for processing.
- **Status Visualization**: Displaying results, preflight findings, and production status.
- **BFF Logic**: Light data aggregation/formatting for UI needs.
- **User Authentication**: Managing product-side sessions and permissions.

## 2. Forbidden Responsibilities
The Product App MUST NOT:
- **Execute Workers**: Background compute must happen in specialized workers.
- **Govern Production**: Matchmaking, redispatch, and SLO monitoring belong to the OS.
- **Manage Printers**: Communication with printer agents belongs to the federation layer.
- **Define Platform Contracts**: Kernel-level schemas belong to `ppos-shared-contracts`.
- **Mirror Repositories**: Other PPOS repositories must not be nested within the product app.

## 3. Communication Pattern
- The Product App interacts with the OS via **REST APIs** or **SDK clients**.
- It consumes shared types from `@ppos/shared-contracts`.
## 4. Architectural Purity
- **No Compatibility Bridges**: As of Phase R5, all transitional shims have been removed. No local files may act as proxies or delegates for logic residing in canonical OS repositories. Direct imports or API calls are mandatory.
