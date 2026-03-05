### **TICKET-001: Establish LEMS Database Schema & Relations**

- **Summary**: Create the complete PostgreSQL relational schema to persistently store roles, currencies, PM records, and transaction history with high data integrity.
- **Implementation**:
  - Define a relational schema in PostgreSQL using Prisma or TypeORM.
  - **Create `currencies` table**:
    - `id`: `UUID` (Primary Key)
    - `symbol`: `VARCHAR` (e.g., "USDC" or "SOL")
    - `decimals`: `INTEGER`
  - **Create `roles` table**:
    - `id`: `UUID` (Primary Key)
    - `name`: `VARCHAR` (e.g., "ADMIN" or "USER")
  - **Create `users` table**:
    - `id`: `UUID` (Primary Key)
    - `name`: `VARCHAR`
    - `wallet_address`: `VARCHAR(44)`
    - `target_balance`: `NUMERIC`
    - `is_active`: `BOOLEAN`
    - `created_at`: `TIMESTAMPTZ`
    - `project_id`: `VARCHAR`
    - `currency_id`: `UUID` (Foreign Key referencing `currencies`)
    - `role_id`: `UUID` (Foreign Key referencing `roles`)
  - **Create `transactions` table**:
    - `id`: `UUID` (Primary Key)
    - `signature`: `VARCHAR(88)` (Must have a **Unique Index** to prevent duplicates)
    - `type`: `ENUM` ('REFILL' or 'SPEND')
    - `merchant_name`: `TEXT`
    - `pm_id`: `UUID` (Foreign Key referencing `users`)
    - `amount`: `NUMERIC`
    - `status`: `VARCHAR` ('PENDING', 'COMPLETED', or 'FAILED')
    - `block_time`: `TIMESTAMPTZ`
- **Acceptance Criteria**:
  - The PostgreSQL migration script successfully creates all four tables (`currencies`, `roles`, `users`, `transactions`) with the exact specified data types.
  - Foreign key relationships (`users.currency_id`, `users.role_id`, `transactions.pm_id`) are strictly enforced by the database.
  - The `transactions` table rejects any attempt to insert a duplicate Solana `signature`.

### **TICKET-002: Register and Manage Users/PMs (CRUD)**

- **Summary**: Provide the Treasurer with an interface to add, edit, and deactivate Project Managers to control monthly budget refill eligibility.
- **Implementation**:
  - **Backend**: Expose a `POST /api/v1/registry` endpoint protected by the `@Roles('ADMIN')` guard.
  - **Backend DTO (`CreatePMDto`)**: Enforce validation using `class-validator`: `name` (`@IsString()`, `@IsNotEmpty()`), `wallet_address` (`@IsSolanaAddress()`), `target_balance` (`@IsPositive()`), and `project_id` (string).
  - **Backend Logic**: Create a custom `@IsSolanaAddress()` decorator that attempts to decode the string using the `@solana/web3.js` `PublicKey` constructor, returning a `400 Bad Request` if it fails.
  - **Frontend**: Build the `<PMRegistryPanel />` data table using `@tanstack/react-table`.
  - **Frontend Validation**: Ensure the form explicitly disables the "Save" button and displays the inline red text: _"Invalid Solana address format. Must be a 44-character public key."_ if the wallet input is invalid.
  - **Frontend Validation**: Ensure the Project ID field displays: _"A Project ID must be assigned to this wallet."_ if left empty.
- **Acceptance Criteria**:
  - The system successfully accepts the `POST` payload and creates a new user, returning `{ "status": "success", "data": { "id": "uuid", "is_active": true } }`.
  - The Treasurer can fully navigate the `<PMRegistryPanel />` using keyboard `Tab` and `Enter` keys to comply with WCAG 2.1 AA.

### **TICKET-003: Configure PM "Target Balances"**

- **Summary**: Allow the Treasurer to set and update the target monthly budget for individual PM wallets.
- **Implementation**:
  - **Backend**: Within the `CreatePMDto` and update DTOs, strict validation must be applied using `@IsNumber()` and `@Min(1)`.
  - **Frontend**: Implement input masking/validation in the `<PMRegistryPanel />` form to prevent entry of 0 or negative numbers.
  - **Frontend UI State**: Display the specific error state _"Target balance cannot be negative or zero."_ if the user attempts to bypass constraints.
- **Acceptance Criteria**:
  - The frontend form prevents submission and shows the correct error text when a value <= 0 is entered.
  - The backend API rejects any payload with a target balance <= 0 with a `400 Bad Request`.

### **TICKET-004: Implement Dual Dashboard Views (Admin vs. PM)**

- **Summary**: Route users to distinct dashboard views based on their authenticated role.
- **Implementation**:
  - **Frontend**: Implement a `<LoginView />` that uses `@solana/wallet-adapter-react` to prompt the user to sign a specific message containing a Nonce.
  - **Frontend State**: Utilize a `useAuth()` custom hook to store the JWT securely in application memory or `sessionStorage` (avoiding `localStorage` for XSS mitigation).
  - **Frontend Routing**: Utilize `React.lazy()` and Suspense to strictly code-split the bundles.
  - **Frontend UI (Admin)**: Route `role === 'ADMIN'` to `/admin/dashboard` containing `<TreasuryPulseHeader />`, `<PMRegistryPanel />`, `<BatchRefillModule />`, and `<GlobalTransactionFeed />`.
  - **Frontend UI (User)**: Route `role === 'USER'` to `/pm/dashboard` containing the `<PersonalBudgetCard />` and `<PersonalTransactionFeed />`.
- **Acceptance Criteria**:
  - The user successfully signs the cryptographic payload and receives a JWT containing their `role` and `uuid`.
  - PMs strictly download only the User bundle, preventing exposure to Admin-heavy reporting modules.

### **TICKET-005: Implement Database Replay Protection & Indexing**

- **Summary**: Establish strict database indexing to guarantee idempotency and ensure fast query performance.
- **Implementation**:
  - **Backend DB**: Enforce a Unique Constraint on the `signature` column in the PostgreSQL `transactions` table.
  - **Backend DB**: Create a compound index on `(pm_id, block_time DESC)` to optimize feed lookups.
  - **Backend Filter**: Implement a `PrismaClientExceptionFilter` that catches `UniqueConstraintViolation` errors specifically to suppress them silently for the `BlockchainMonitorService` to ensure idempotency.
- **Acceptance Criteria**:
  - The database strictly prevents identical Solana signatures from being written twice.
  - The `GET /api/v1/transactions` endpoint utilizes the compound index to respond in under 50ms.

---

### **TICKET-006: Implement Real-Time Wallet Monitor (onLogs)**

- **Summary**: Subscribe to Solana WebSockets to detect spending and refills instantly.
- **Implementation**:
  - **Backend Service**: Create the `WalletMonitorService` within the `BlockchainModule`.
  - **Backend Logic**: On startup, query the database for all PM wallets where `is_active = true`.
  - **Backend RPC**: Open a WebSocket connection using `@solana/web3.js` and `connection.onLogs()` for the array of active addresses.
  - **Backend Logic**: Pass any detected transaction signature directly to the `MetadataExtractorService` for processing.
- **Acceptance Criteria**:
  - The service successfully subscribes to `onLogs` and captures new events within the required 10-second threshold.

### **TICKET-007: Extract Merchant Metadata from Spend Events**

- **Summary**: Transform cryptic blockchain hashes into readable accounting data by extracting merchant details.
- **Implementation**:
  - **Backend Service**: Create the `MetadataExtractorService`.
  - **Backend Logic**: Utilize the `getParsedTransaction` RPC method to fetch full instruction data for the signature.
  - **Backend Parsing**: Parse the instruction data to categorize the `type` as `SPEND` or `REFILL` and extract the plaintext merchant description.
  - **Backend Events**: Ensure successful insertion into the DB triggers the `WSEventEmitterInterceptor` to emit the `NEW_TRANSACTION` socket event.
- **Acceptance Criteria**:
  - The metadata extractor accurately persists the Merchant Name, Amount, and Timestamp to the database.
  - The extraction triggers the WebSocket gateway to push the serialized transaction object down to the client.

### **TICKET-008: Implement Transaction History Back-Filler**

- **Summary**: Automatically fetch missed transactions during startup or RPC outages to prevent data gaps.
- **Implementation**:
  - **Backend Service**: Create the `TransactionBackfillerService` within the `BlockchainModule`.
  - **Backend Logic**: Schedule the service to run on application startup and periodically via cron (e.g., every 15 minutes).
  - **Backend RPC**: Use `getSignaturesForAddress` on all active wallets and array-diff the results against the `signature` column in the DB to process only missing hashes.
- **Acceptance Criteria**:
  - The system automatically recovers and populates missing transactions if the WebSocket monitor disconnects.

### **TICKET-009: Unified API for Live Spending Feed**

- **Summary**: Create a single API endpoint to serve both global and scoped transaction feeds.
- **Implementation**:
  - **Backend Endpoint**: Implement `GET /api/v1/transactions` inside the Transaction Controller.
  - **Backend DTO (`TransactionQueryDto`)**: Accept query parameters `limit` (number), `type` (enum), and `pm_id` (string).
  - **Backend Security**: Apply `@UseGuards(JwtAuthGuard)`. Implement internal logic where if `req.user.role === 'USER'`, the controller explicitly overrides the `pm_id` query parameter with `req.user.id`.
- **Acceptance Criteria**:
  - The endpoint returns a JSON payload containing a `transactions` array and a `pagination` object with `has_more` and `next_cursor`.
  - It is computationally impossible for a PM to query another PM's transactions via this endpoint.

### **TICKET-010: Implement RPC Failover & Retry Strategy**

- **Summary**: Ensure the backend system remains resilient against Solana RPC node latency and rate limits.
- **Implementation**:
  - **Backend Config**: Populate the `.env` file with an array of fallback RPC endpoints (e.g., Helius, QuickNode, Alchemy).
  - **Backend Logic**: Implement round-robin logic in the `BlockchainModule` to swap endpoints if a `429 Too Many Requests` or connection drop is detected.
  - **Frontend Logic**: In the `useLiveTransactions` hook, detect socket drops and display a yellow banner: _"Live Feed Disconnected. Attempting to reconnect..."_.
  - **Frontend Fallback**: Degrade to polling `GET /api/v1/transactions` every 30 seconds until the socket is restored.
- **Acceptance Criteria**:
  - The backend automatically maintains connection stability during individual RPC node outages.
  - The frontend gracefully falls back to polling to ensure data remains visible.

---

### **TICKET-011: Monthly Refill Scheduler (Cron Job)**

- **Summary**: Implement a server-side Cron job to trigger the refill calculation automatically.
- **Implementation**:
  - **Backend Service**: Create the `RefillCronService` within the `RefillModule`.
  - **Backend Logic**: Utilize `@nestjs/schedule` and explicitly define the `@Cron('0 0 1 * *')` decorator to run the calculation exactly on the 1st of the month at 00:00.
- **Acceptance Criteria**:
  - The cron job triggers accurately on schedule without manual intervention.

### **TICKET-012: Calculate On-Chain Refill Amounts**

- **Summary**: Calculate the specific fund amounts required to top up each PM wallet to its target.
- **Implementation**:
  - **Backend Logic**: Inside the `RefillCronService`, query the DB for users where `is_active = true`.
  - **Backend Calculation**: Fetch current on-chain balances and calculate the difference: `target_balance - current_balance`.
  - **Backend State**: Stage the results in a "Batch Refill Proposal" to be read by the frontend.
- **Acceptance Criteria**:
  - The system accurately computes the exact `amount` needed per wallet to reach the target balance.

### **TICKET-013: Admin Single-Click Batch Approval**

- **Summary**: Present a calculated batch of refills for Admin approval to execute multiple transfers simultaneously.
- **Implementation**:
  - **Frontend Component**: Build `<BatchRefillModule />` using the `useRefillEngine()` hook to expose the `approveBatch()` function.
  - **Backend Endpoint**: Expose `POST /api/v1/refill/propose` guarded by `@Roles('ADMIN')`, expecting a payload `{ "reason": string }`.
  - **Backend Safety**: The `ExecutionService` must run `simulateTransaction` via the RPC before generating a signature.
  - **Backend Error Handling**: If simulation fails (e.g., insufficient treasury funds), abort and return a `422 Unprocessable Entity`.
- **Acceptance Criteria**:
  - The transaction successfully executes and returns `{ "data": { "batch_signature": "...", "total_distributed": 1250.0 } }`.
  - The frontend locks the UI in a "Processing" state until the `batch_signature` is returned.

### **TICKET-014: Manual Refill Override**

- **Summary**: Provide Admins with a manual override to execute refills outside of the automated monthly schedule.
- **Implementation**:
  - **Frontend UI**: Add a manual trigger button within the `<BatchRefillModule />` interface.
  - **Backend Routing**: Ensure the `POST /api/v1/refill/propose` endpoint handles the execution payload outside of the cron schedule.
- **Acceptance Criteria**:
  - Admins can execute batch transfers on-demand to handle off-cycle budget adjustments.

### **TICKET-015: Implement Dynamic Priority Fees**

- **Summary**: Implement dynamic Compute Unit pricing to ensure transactions are confirmed during network congestion.
- **Implementation**:
  - **Backend RPC**: Inside the `ExecutionService`, query the `getRecentPrioritizationFees` RPC method before constructing the batch transaction.
  - **Backend Instruction**: Append the `@solana/web3.js` `ComputeBudgetProgram.setComputeUnitPrice` instruction to the transaction payload, targeting the network median/high fee tier.
- **Acceptance Criteria**:
  - Batch refill transactions successfully finalize on-chain during high Solana network traffic.

---

### **TICKET-016: Real-Time Treasury "Pulse" Header**

- **Summary**: View a high-level summary of the Master Treasury and total PM balances on the dashboard.
- **Implementation**:
  - Frontend: Build the `<TreasuryPulseHeader />` widget.
  - Frontend: Fetch and display the Master Treasury balance and the Total Distributed Balance across all PMs.
- **Acceptance Criteria**:
  - The header displays the Master Treasury and PM totals with less than 200ms of UI lag on load.
  - The Pulse Header totals update automatically within 10 seconds of an on-chain event.

### **TICKET-017: Live Transaction Feed with Metadata**

- **Summary**: See a scrollable feed of all PM spending and refills to monitor real-world card usage.
- **Implementation**:
  - **Frontend Component**: Build `<GlobalTransactionFeed />` and `<PersonalTransactionFeed />` utilizing `@tanstack/react-table` for data management and `@tanstack/react-virtual` for DOM virtualization.
  - **Frontend Security**: Treat merchant strings as untrusted input; strictly avoid `dangerouslySetInnerHTML` to prevent XSS.
  - **Frontend A11y**: Ensure red/green text colors for `SPEND` and `REFILL` meet WCAG 2.1 AA contrast requirements.
  - **Frontend Hook**: Implement the `useLiveTransactions` hook to `unshift` new websocket payloads to the top of the feed automatically.
- **Acceptance Criteria**:
  - The feed remains smooth at 60fps even with 10,000+ cached items rendered in the DOM.
  - Every transaction block includes a functioning hyperlink to the Solana Explorer.

### **TICKET-018: Project-Based Spending Analytics**

- **Summary**: Visualize financial outflow categorized by specific projects.
- **Implementation**:
  - **Frontend Component**: Implement chart widgets using the `recharts` library.
  - **Frontend Logic**: Process the data fetched by `TanStack Query` to aggregate spending amounts, grouping them by the `project_id` field.
- **Acceptance Criteria**:
  - Admins can view styled, composable charts that break down budget usage per project.

### **TICKET-019: Exportable Financial Reports (CSV/JSON)**

- **Summary**: Download filtered transaction data in CSV or JSON formats to simplify month-end reconciliation.
- **Implementation**:
  - **Frontend Component**: Build `<ExportReportsModal />` using `Radix UI` or `Headless UI` unstyled primitives styled with Tailwind.
  - **Frontend Filters**: Implement state filters for Date Range, PM Name, and Project ID.
  - **Frontend Logic**: Implement client-side logic to format the currently filtered table data into downloadable `.csv` and `.json` blobs.
- **Acceptance Criteria**:
  - The exported files contain all selected metadata columns (Merchant, Amount, Signature, Time) accurately reflecting the active UI filters.

### **TICKET-020: Implementation of Status Alerts & Notifications**

- **Summary**: Provide real-time UI feedback for backend API responses and network degradation states.
- **Implementation**:
  - **Frontend Service**: Create a global HTTP API wrapper using `TanStack Query` that catches specific HTTP error codes (e.g., 400, 403, 422).
  - **Frontend A11y**: When a `NEW_TRANSACTION` socket event arrives, use `aria-live="polite"` regions to announce the new spend to screen readers seamlessly.
- **Acceptance Criteria**:
  - Errors like `422 Unprocessable Entity` trigger a visible global toast notification explaining the failure.
  - Screen readers accurately announce dynamic dashboard changes.

---

### **TICKET-021: Secure Key Management for Master Treasury**

- **Summary**: Securely store and access the Master Treasury private key to enable automated batch transfers.
- **Implementation**:
  - **Backend Security**: Inject the private key into the node environment exclusively as a Base58 string via `.env` or AWS/GCP Secrets Manager.
  - **Backend Service**: Ensure the `ExecutionService` instantiates the keypair into memory solely during the execution block of `POST /api/v1/refill/propose`.
  - **Backend Memory**: Allow the Node.js garbage collector to immediately clear the key reference after the signature buffer is generated.
- **Acceptance Criteria**:
  - The private key is never written to the PostgreSQL database.
  - API responses never leak the private key or seed phrase.

### **TICKET-022: Enforce Backend Endpoint RBAC Middleware**

- **Summary**: Implement role-checking middleware on API routes to ensure strict access controls.
- **Implementation**:
  - **Backend Auth**: Apply the `JwtAuthGuard` globally across all protected controllers.
  - **Backend RBAC**: Implement the custom `RolesGuard` mapping to a `@Roles('ADMIN')` decorator for the `/api/v1/registry` and `/api/v1/refill/*` endpoints.
  - **Backend Logic**: If the JWT `req.user.role` does not match, the guard must throw a `403 Forbidden` Exception before reaching the controller.
- **Acceptance Criteria**:
  - Attempts by a PM (`USER` role) to execute a refill or modify the registry return an immediate HTTP 403.

### **TICKET-023: Emergency "Pause Specific PM Wallet”**

- **Summary**: Provide Admins with a mechanism to pause automated refills for specific wallets to prevent fund loss.
- **Implementation**:
  - **Backend Endpoint**: Implement a `PATCH /api/v1/registry/:id/status` route in the Registry Controller.
  - **Frontend Component**: Render a visual toggle switch via the `useRegistryManager()` hook next to each PM in the `<PMRegistryPanel />`.
  - **Backend Gateway**: Upon a successful DB update, trigger the WebSockets gateway to emit a `PM_STATUS_CHANGED` event with payload `{ pm_id: "uuid", is_active: false }`.
- **Acceptance Criteria**:
  - Toggling the switch instantly updates the UI with a warning badge for all connected Admin sessions via the WebSocket push.
  - The `RefillCronService` strictly ignores the paused wallet during the next batch calculation.

### **TICKET-024: Audit Log for Admin Administrative Actions**

- **Summary**: Maintain an immutable log of all actions taken by Admins to ensure accountability.
- **Implementation**:
  - **Backend Interceptor**: Create an `AuditLogInterceptor` attached to the Registry and Refill controllers.
  - **Backend DB**: Intercept successful `POST`/`PATCH` events, extract the Admin's `wallet_address` from the request JWT, and write a row to an `audit_logs` table containing the Action name, Timestamp, and Target ID.
- **Acceptance Criteria**:
  - Changing a PM's target balance creates an immutable audit record of the action tied to the Admin's specific wallet address.
  - Executing a batch refill logs the action and ties the Admin's wallet to the generated on-chain batch signature.
