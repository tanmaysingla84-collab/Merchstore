# Contributing to Geeta University MerchStore

Welcome! This doc explains how our 4-member team works together on this repo —
ownership, branching, commit/PR conventions, the API contract process, weekly
merge schedule, setup, testing, and deployment. Read this fully before opening
your first PR.

---

## Team & Ownership

| Member | Role | Owns |
|--------|------|------|
| **M1** | Backend Lead — Auth, Models, Products | `server/config/`, `server/models/` (all 6: User, Product, Order, Cart, Coupon, Review), `server/middleware/`, `server/validators/authValidator.js`, `server/validators/productValidator.js`, `controllers/authController.js`, `controllers/productController.js`, `routes/authRoutes.js`, `routes/productRoutes.js`, `utils/generateToken.js`, `utils/cloudinaryUpload.js`, `server.js`, `.env.example` |
| **M2** | Backend — Transactions, Payments & Real-Time | `controllers/{cart,order,payment,coupon,review,analytics}Controller.js`, `routes/{cart,order,payment,coupon,review,analytics}Routes.js`, `validators/{cart,order,review}Validator.js`, `services/{stripe,email,inventory}Service.js`, `cron/lowStockCron.js`, `socket/orderSocket.js`, `utils/analyticsHelpers.js` |
| **M3** | Frontend — Customer UI & State | `client/src/app/store.js`, `features/{auth,cart,products,orders}/`, customer `pages/` (Home, Login, Register, ProductList, ProductDetail, Cart, Checkout, OrderConfirm, UserDashboard), shared `components/`, `hooks/`, `utils/api.js`, `App.jsx`, `main.jsx`, Tailwind config |
| **M4** | Frontend Admin + DevOps | `client/src/pages/admin/`, `components/admin/`, `components/{ReviewList,ReviewForm,CouponInput}.jsx`, `features/admin/`, `routes/AdminRoutes.jsx`, `postman/`, `docs/`, `.github/workflows/`, `.github/pull_request_template.md` |

**Golden rule:** only edit files inside your owned folders. If you need a change in
someone else's file (e.g. a schema tweak in M1's model, or adding a section to M3's
`ProductDetail.jsx`), open a PR against *their* file, keep the diff minimal and
clearly marked, and request their review — never push directly to it.

---

## Branching Strategy

```
main          ← production-ready, tagged releases only
└── dev       ← integration branch, always runnable
    ├── feature/m1-auth-products
    ├── feature/m2-transactions
    ├── feature/m3-frontend
    └── feature/m4-admin-integration
```

- **Sub-feature branches** are encouraged inside your own scope, e.g.
  `feature/m1-models`, `feature/m1-auth`, `feature/m1-cloudinary`,
  `feature/m2-stripe`, `feature/m2-sockets`. Merge these into your own
  `feature/mX-*` branch first, then that branch merges into `dev`.
- **`main` branch protection:** requires 2 PR approvals + CI (ESLint + Jest) pass.
- **`dev` branch protection:** requires 1 PR approval + CI pass.
- **Merge strategy:** squash-merge `feature/*` → `dev`; regular merge commit
  `dev` → `main`.

---

## Commit & PR Conventions

**Commit / PR title format:**
```
[M<n>] <type>: <short description>
```
Types: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`

Examples:
- `[M1] feat: add Product model with size/stock schema`
- `[M2] fix: prevent double stock decrement on Stripe retry`
- `[M3] feat: add ProductList filter sidebar`
- `[M4] feat: add RevenueChart to AdminAnalytics`

**Every PR must include (see `.github/pull_request_template.md`):**
- [ ] What changed and why
- [ ] Linked API contract row(s), if applicable
- [ ] Screenshots/GIF for UI changes
- [ ] `npm run lint` passes with 0 errors, Prettier formatted
- [ ] Tests added/updated, `npm test` passes
- [ ] No edits outside your owned folders (or explicit sign-off from the file's owner)
- [ ] `.env.example` updated if new env vars were introduced

---

## API Contract Process

Before any backend endpoint is consumed by the frontend, it must be documented and
agreed in the shared **MerchStore API Contract** doc (Notion/Google Sheet):

`Endpoint | Method | Request Body (JSON) | Response Shape (JSON) | Status Codes | Owner (M1/M2) | Consumer (M3/M4) | Status (Draft/Agreed/Implemented)`

**Mandatory checkpoints:**

1. **Week 1 — Full Draft Contract**
   - M1 documents: Auth endpoints, Product endpoints (request/response shapes, error formats)
   - M2 documents: Cart, Order, Payment, Coupon, Review, Analytics endpoints
   - M3/M4 review and flag any missing fields needed by UI
   - All 4 sign off — no changes to agreed fields without a PR discussion

2. **Week 3 — Auth + Product Contract Locked**
   - M1 deploys auth routes to `dev`; M3 tests against live API
   - Field mismatch → raise a GitHub Issue, M1 fixes within 24hrs
   - Response envelope `{ success, data, message, pagination }` strictly enforced

3. **Week 4 — Cart + Order Contract Locked**
   - M2 deploys cart/order routes; M3 tests Cart page and Checkout flow
   - Stripe `clientSecret` field name confirmed (`data.clientSecret`)
   - Socket event names confirmed: `ORDER_STATUS_UPDATED`, `PAYMENT_CONFIRMED`

4. **Week 5 — Admin + Analytics Contract Locked**
   - M2 deploys analytics routes; M4 connects charts
   - M1 confirms admin product endpoints; M4 connects product form modal
   - Review endpoint fields confirmed: `rating` (1–5 int), `comment` (string)

**Breaking Change Policy** — any breaking change to an agreed endpoint requires:
1. A GitHub Issue labeled `breaking-change`
2. 24-hour notice in the team channel
3. PR review by the consuming member (M3 or M4) before merge
4. A version bump on the route (e.g. `/api/v2/...`) if the change cannot be
   made backward-compatible

---

## Weekly Checkpoint Merge Schedule

| Week | Event | Branches Merging |
|------|-------|-------------------|
| 1 end | API contract document finalized & signed off by all 4 | No code merge yet |
| 2 end | M1 models + auth scaffolding ready | M1 merges `feature/m1-models` sub-branch → `dev` |
| 3 end | M1 Auth APIs + M3 React scaffold + Redux ready | M1 auth routes → `dev`; M3 scaffold → `dev` |
| 4 end | M1 Product APIs + M2 Cart APIs + M3 Product pages ready | All three → `dev` (coordinate sequentially, 1hr window) |
| 5 end | M2 Orders/Stripe/WebSocket + M3 Checkout + M4 Admin Products | Merge M2, M3 checkout, M4 admin → `dev` |
| 6 end | M2 Analytics/Coupons/Reviews + M4 Admin Orders/Analytics | Merge M2 and M4 remaining features → `dev` |
| 7 end | Deployment complete; all features on `dev` | `dev` → `main` (pre-release merge) |
| 8 end | Final QA, README, tag release | Tag `v1.0.0` on `main` |

---

## Local Setup

```bash
git clone <repo-url>
cd merchstore

# backend
cd server
cp .env.example .env      # fill in your own keys (Mongo, JWT, Google OAuth, Cloudinary, Stripe, SMTP)
npm install
npm run dev

# frontend
cd ../client
cp .env.example .env      # VITE_API_BASE_URL, VITE_STRIPE_PUBLISHABLE_KEY, VITE_SOCKET_URL, VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`
(Vite proxies `/api` to the backend — see `vite.config.js`). Never commit real
`.env` files — only `.env.example` is tracked in git.

---

## Testing

- **Backend (M1/M2):** Jest + Supertest. Target ≥70% coverage on auth, model
  validation, order, and payment controllers. Mock Cloudinary and Stripe in tests.
- **Frontend (M3/M4):** React Testing Library / Vitest for critical components —
  `ProductCard`, `CartItem`, `OrderStatusTracker`, `RevenueChart`, `CouponInput`,
  and at least 5 components total.
- **API (M4):** Postman collection lives in `postman/`, one folder per domain
  (Auth, Products, Cart, Orders, Payment, Coupons, Reviews, Analytics), with
  `{{baseUrl}}`, `{{authToken}}`, `{{adminToken}}` env variables and pre-request
  scripts to auto-set tokens from login responses. Run via Newman:
  ```bash
  newman run postman/GeetaUniversity_MerchStore.postman_collection.json -e env.json
  ```

Run lint and tests before opening any PR:
```bash
npm run lint
npm test
```

---

## Deployment

- **Database:** MongoDB Atlas — confirm indexes (`User.email`, `Product.category`,
  `Order.userId`, `Review.productId`), whitelist `0.0.0.0/0` for Render, use a
  scoped `prod` DB user.
- **Backend:** Render — Web Service connected to `main`, env vars set in Render
  dashboard, build `npm install`, start `node server.js`, verify `/api/health`.
- **Frontend:** Vercel — root directory `client/`, env vars set
  (`VITE_API_BASE_URL` pointing at the Render URL), verify `npm run build` locally
  before deploying.
- **Stripe webhook:** configure `https://<render-url>/api/payment/webhook` in the
  Stripe Dashboard; verify with `stripe trigger` in production.
- **CORS:** update `CLIENT_URL` on Render to the Vercel production URL once known.

---

## Code Style

- ESLint + Prettier are enforced repo-wide — run `npm run lint -- --fix` before
  pushing. Zero ESLint errors is a merge requirement.
- Backend request validation: Zod/Joi schemas live only in `validators/`.
- Keep controllers thin — business logic belongs in `services/` (M2's domain)
  where applicable.
- API responses always use the shared envelope: `{ success, data, message, pagination }`.
- Follow the existing folder structure; don't introduce new top-level directories
  without a quick team discussion first.
- Mobile-first Tailwind, WCAG 2.1 AA target on all customer-facing pages (M3).

---

## Environment Variables Reference

Both `server/.env.example` and `client/.env.example` are kept up to date as the
single source of truth. Whenever you add a new variable:
1. Add it to the relevant `.env.example` with a placeholder value
2. Announce it in the team channel so others can pull it into their local `.env`
3. Never commit real secrets, API keys, or credentials to the repo

---

## Definition of Done (per feature branch)

- [ ] All owned endpoints/pages implemented per the task checklist for your week
- [ ] Unit/integration tests written and passing
- [ ] Lint clean, Prettier formatted
- [ ] API contract rows updated to `Implemented` status
- [ ] Postman collection updated (backend) or manually tested against live API (frontend)
- [ ] No merge conflicts with `dev`
- [ ] PR approved by at least 1 reviewer before merge

---

## Questions?

Ping the team channel or tag the relevant owner (M1–M4) directly in your PR.
When in doubt, open a Draft PR early — feedback is cheaper before code is
finished than after.
