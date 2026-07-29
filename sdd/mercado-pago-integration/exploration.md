## Exploration: Mercado Pago Integration — End-to-End Flow

### Current State

The system has a solid **foundation** for Mercado Pago but the **end-to-end flow is incomplete**:

**What exists:**

- `MercadoPagoService` — creates preferences and handles webhook payment lookups via the official `mercadopago` SDK
- `POST /api/mercado-pago/preferencia` — creates a payment preference (expects `ventaId` + `items[]`)
- `POST /api/mercado-pago/webhook` — receives IPN notifications, queries MP API, **but only logs the result**
- Conditional mounting in `index.ts` (only when `MERCADO_PAGO_ACCESS_TOKEN` + `MERCADO_PAGO_PUBLIC_KEY` are set)
- 21 TDD tests covering the service, routes, and config
- `mercado_pago` accepted as a valid `metodo_pago` in all schema/DTO validations
- `METODO_PAGO_DEFAULTS` in both `VentasService` and `PagosService` set `mercado_pago → pendiente`

**What's missing:**

1. **Frontend MP flow**: `handleConfirmSale` in `Ventas.tsx` calls `api.createVenta()` then clears the cart — it never creates the MP preference or redirects to MP checkout
2. **Webhook DB update**: The webhook route receives payment data but never updates `ventas.estado` or `pagos.estado` in the database
3. **Return URL handling**: The `/ventas?pago=exito` URL is referenced in `back_urls` but the frontend has no logic to read or act on this query parameter
4. **No PATCH/PUT endpoint** to update venta or pago status after webhook notification

### Database Schema Findings

**ventas table:**

```
id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
cliente_id      BIGINT UNSIGNED NULL
fecha_venta     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
subtotal        DECIMAL(10,2) NOT NULL
descuento       DECIMAL(10,2) DEFAULT 0
impuestos       DECIMAL(10,2) DEFAULT 0
total           DECIMAL(10,2) NOT NULL
metodo_pago     ENUM('efectivo','tarjeta','transferencia','mercado_pago','cuenta_dni','modo','otro') NOT NULL
estado          ENUM('pendiente','completada','cancelada') NOT NULL DEFAULT 'completada'
notas           TEXT
created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

**pagos table:**

```
id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
venta_id            BIGINT UNSIGNED NOT NULL
metodo_pago         ENUM(...) NOT NULL
monto               DECIMAL(10,2) NOT NULL
referencia_externa  VARCHAR(255) NULL  ← stores MP payment ID
estado              ENUM('pendiente','aprobado','rechazado','reembolsado') NOT NULL DEFAULT 'aprobado'
datos_json          JSON NULL          ← stores full MP response payload
created_at          DATETIME
updated_at          DATETIME
```

**Key finding:** The `ventas.estado` is **hardcoded to `'completada'`** in `VentasService.createVenta()` for ALL payment methods (line 234). This means MP payments are marked as completed immediately, before payment is actually confirmed. The `pagos.estado` correctly defaults to `'pendiente'` for MP, but the venta itself is already `'completada'`.

The `pagos` table already has `referencia_externa` and `datos_json` columns ready to store MP response data — they're currently inserted as `null` for MP.

### Frontend Flow Analysis

**Current flow for ALL payment methods (including MP):**

1. User adds products to cart → sees total in `PaymentSelector`
2. User selects payment method (e.g., "Mercado Pago") → clicks "Confirmar Venta"
3. `handleConfirmSale(metodo)` is called in `Ventas.tsx`
4. Validates payload with `ventaCreateSchema`
5. Calls `api.createVenta(payload)` → `POST /api/ventas`
6. On success: clears cart, shows success notification, reloads ventas list
7. **No MP-specific branching** — it treats MP exactly like efectivo/tarjeta

**What should happen for MP (but doesn't):**

- After `createVenta` succeeds → get the `venta.id` from response
- Call `api.post('/mercado-pago/preferencia', { ventaId: venta.id, items: [...] })`
- Get back `{ url, preference_id }` → redirect `window.location.href = url`
- The `preference_id` should be saved as `referencia_externa` on the pago
- When user returns from MP (to `/ventas?pago=exito`), the frontend should check for the query param and show appropriate feedback

**PaymentSelector component:** Pure presentational — no MP-specific UI differences needed. The radio button for "Mercado Pago" is already there.

### Backend Flow Analysis

**createVenta flow (VentasService):**

1. Validates stock with `SELECT ... FOR UPDATE`
2. Inserts venta row with `estado = 'completada'` (hardcoded — BUG for MP)
3. Inserts venta_detalle rows
4. Inserts pago row with `estado = METODO_PAGO_DEFAULTS[metodo_pago]` → MP gets `'pendiente'`
5. Commits transaction
6. Returns `VentaResponse` with nested pagos

**Bug identified:** For MP, the venta should be `'pendiente'` initially, and only transition to `'completada'` when the webhook confirms approval. Currently `estado` is hardcoded to `'completada'` in the INSERT statement regardless of `metodo_pago`.

**Webhook flow (current):**

1. Receives POST with `{ type, data: { id } }`
2. If `type === 'payment'`, calls `MercadoPagoService.handleWebhook(paymentId)`
3. Gets payment details: `{ status, external_reference, payment_id, transaction_amount }`
4. **Logs and does nothing else** — no DB update

**What should happen in webhook:**

1. Parse `external_reference` → that's the `venta_id`
2. Look up the pago by `venta_id` (where `metodo_pago = 'mercado_pago'`)
3. Update `pagos.estado` based on MP status (approved → aprobado, rejected → rechazado, etc.)
4. Update `pagos.referencia_externa` with MP payment_id
5. Update `pagos.datos_json` with full MP response
6. If status is `approved`, also update `ventas.estado = 'completada'`
7. If status is `rejected`/`cancelled`, update `ventas.estado = 'cancelada'`

**Currently there is NO method to update pago or venta status** — need to add to PagosService and VentasService.

### Env Vars & Config

| Variable                    | Present in `.env`        | Present in `.env.example` | Used in                                                          |
| --------------------------- | ------------------------ | ------------------------- | ---------------------------------------------------------------- |
| `MERCADO_PAGO_ACCESS_TOKEN` | No                       | No                        | MercadoPagoService constructor, verificarConfiguracion           |
| `MERCADO_PAGO_PUBLIC_KEY`   | No                       | No                        | verificarConfiguracion only (not used elsewhere)                 |
| `FRONTEND_URL`              | No (`CLIENT_URL` exists) | No                        | MercadoPagoService.createPreference (defaults to localhost:5173) |

**Note:** `MERCADO_PAGO_PUBLIC_KEY` is only checked in `verificarConfiguracion()` but never actually used in the service itself (the SDK only needs `accessToken`). This is harmless but worth noting — only `accessToken` is functionally required.

**Note:** `.env` has `CLIENT_URL=http://localhost:5173` but `MercadoPagoService` reads `FRONTEND_URL`. These should be aligned.

### Gaps & Questions Before Implementation

1. **Venta estado logic**: Should `createVenta` set `ventas.estado = 'pendiente'` for MP payments? Currently hardcoded to `'completada'`. This requires changing the INSERT statement in `VentasService.createVenta`.

2. **Webhook → DB update**: Need a new method in `PagosService` (e.g., `updateStatusByVentaId`) and possibly in `VentasService` (e.g., `updateVentaStatus`). Or is it better to do this from within the webhook handler?

3. **Return URL UX**: What should the frontend show when the user returns from MP checkout? The `?pago=exito` / `?pago=fallo` / `?pago=pendiente` params need handling in `Ventas.tsx` or a dedicated page.

4. **IPN signature verification**: The webhook route has a placeholder `x-signature` log but no actual verification. Mercado Pago sends `x-signature` and `x-request-id` headers. Should we implement signature validation before processing?

5. **MP test/sandbox mode**: Should we add a `MERCADO_PAGO_USE_SANDBOX` flag? The SDK might detect sandbox from the access token (test vs prod tokens), but worth confirming.

6. **Preference creation timing**: Should the MP preference be created BEFORE or AFTER the venta?
   - **Current pattern** (implied by the API): Create venta first → then create preference with `ventaId` as `external_reference`
   - **Alternative**: Create preference first → then create venta on success callback
   - For this system, the first approach is correct since we want to reserve stock

7. **Idempotency of webhooks**: Mercado Pago can send duplicate webhook notifications. How do we ensure we don't double-process the same payment? The `pagos.referencia_externa` field can serve as a unique key — check if it's already set before updating.

### Risk Areas

| Risk                                                                                                                      | Severity | Mitigation                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Webhook security** — anyone can POST to `/api/mercado-pago/webhook` and potentially trigger status changes              | High     | Implement IPN signature verification using `x-signature` header and MP's public key. Also validate `topic` / `type` field                                                                                                           |
| **Webhook idempotency** — duplicate notifications could double-process                                                    | Medium   | Check `referencia_externa` on the pago before updating; skip if already set                                                                                                                                                         |
| **Venta status inconsistency** — venta shows `completada` before payment is confirmed                                     | Medium   | Change `createVenta` to set `estado = 'pendiente'` for MP (and potentially other async methods)                                                                                                                                     |
| **Stock reservation** — stock is decremented immediately on venta creation, but MP payment might fail                     | High     | Currently stock is deducted via `venta_detalle` insert with FK to stock — need to verify if stock is actually decremented. If the webhook never confirms, stock is lost. Consider pending stock reservations or a timeout mechanism |
| **Test credentials** — no `.env.example` entries for MP means new devs won't know how to set it up                        | Low      | Add `MERCADO_PAGO_ACCESS_TOKEN` and `MERCADO_PAGO_PUBLIC_KEY` to `.env.example` with comments                                                                                                                                       |
| **FRONTEND_URL alignment** — env var name mismatch between MP config and existing `.env` (`CLIENT_URL` vs `FRONTEND_URL`) | Low      | Either add `FRONTEND_URL` or refactor MercadoPagoService to use `CLIENT_URL`                                                                                                                                                        |

### Ready for Proposal

**Yes** — the gaps are well-understood and the implementation approach is clear. The proposal phase should cover:

1. Add `updatePagoStatus` to PagosService (for webhook → DB)
2. Add `updateVentaStatus` to VentasService
3. Fix `createVenta` to use `'pendiente'` estado for MP
4. Add webhook handling logic in the route (update pago + venta)
5. Add MP preference creation flow in frontend after venta creation
6. Add return URL handling in Ventas.tsx (read `?pago=` params)
7. Add IPN signature verification to the webhook route
8. Add `MERCADO_PAGO_*` vars to `.env.example`
9. Align `FRONTEND_URL` / `CLIENT_URL` env var
