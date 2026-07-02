# Geeta University MerchStore — Implementation Plan
### 4-Member Parallel Work-Streams | 8-Week Timeline | MERN Stack

---

# PART 1 — Member 1: Backend Foundation (Auth, Models, Product APIs, Cloudinary)

## 1. Role / Title
**Member 1 — Backend Lead: Auth, Core Models & Product APIs**

---

## 2. Owned Modules / Features
- Project scaffolding & monorepo/folder structure setup
- MongoDB schema design and models for **all 6 collections**
- Auth APIs: Register, Login, JWT, bcrypt, Google OAuth 2.0, RBAC middleware
- Product CRUD APIs (admin + public)
- Cloudinary image upload integration
- Global middleware: error handler, rate limiter, Joi/Zod validation, CORS, Helmet

---

## 3. Owned Folder / File Structure

```
server/
├── config/
│   ├── db.js                  ✅ M1
│   ├── cloudinary.js          ✅ M1
│   └── passport.js            ✅ M1 (Google OAuth)
├── models/
│   ├── User.js                ✅ M1
│   ├── Product.js             ✅ M1
│   ├── Order.js               ✅ M1
│   ├── Cart.js                ✅ M1
│   ├── Coupon.js              ✅ M1
│   └── Review.js              ✅ M1
├── middleware/
│   ├── authMiddleware.js      ✅ M1 (JWT verify + RBAC)
│   ├── errorHandler.js        ✅ M1
│   ├── rateLimiter.js         ✅ M1
│   └── validate.js            ✅ M1 (Joi/Zod wrapper)
├── validators/
│   ├── authValidator.js       ✅ M1
│   └── productValidator.js    ✅ M1
├── controllers/
│   ├── authController.js      ✅ M1
│   └── productController.js   ✅ M1
├── routes/
│   ├── authRoutes.js          ✅ M1
│   └── productRoutes.js       ✅ M1
├── utils/
│   ├── generateToken.js       ✅ M1
│   └── cloudinaryUpload.js    ✅ M1
├── .env.example               ✅ M1
├── server.js                  ✅ M1 (entry point)
└── package.json               ✅ M1
```

> **Rule:** Member 2 only touches `controllers/`, `routes/`, `validators/` for their own modules. Neither M2 nor M1 edits the other's controller/route files.

---

## 4. Step-by-Step Task Checklist (8-Week Timeline)

### Week 1 — Project Foundation
- [ ] Initialize Node.js project: `npm init`, install core deps
- [ ] Set up `server.js` with Express, CORS, Helmet, morgan
- [ ] Connect MongoDB Atlas via Mongoose (`config/db.js`)
- [ ] Create `.env.example` with all required variables (shared with team)
- [ ] Set up ESLint + Prettier config (`.eslintrc`, `.prettierrc`) — **team-wide**
- [ ] Create Git repo, set up `main`/`dev` branches, share branching convention doc
- [ ] Define and publish **API contract document** (shared Google Sheet / Notion) — all 4 members align on request/response shapes

### Week 2 — All 6 Mongoose Models
- [ ] `User.js`: `name`, `email` (unique, indexed), `password` (hashed), `role` (enum: student/faculty/admin), `googleId`, `addresses[]` (`{street, city, state, pincode, isDefault}`), timestamps
- [ ] `Product.js`: `name`, `description`, `category` (indexed), `price`, `images[]` (Cloudinary URLs), `sizes[]` (`{size, stock}`), `totalStock` (virtual), `ratings[]` (ref Review), `averageRating`, timestamps
- [ ] `Order.js`: `userId` (ref User, indexed), `items[]` (`{productId, name, qty, size, price}`), `totalAmount`, `paymentMethod`, `paymentStatus`, `status` (enum), `address`, `stripePaymentIntentId`, timestamps
- [ ] `Cart.js`: `userId` (ref User, unique), `items[]` (`{productId, qty, size}`), timestamps
- [ ] `Coupon.js`: `code` (unique, indexed), `discountPct`, `expiresAt`, `usageLimit`, `usedCount`
- [ ] `Review.js`: `userId` (ref User), `productId` (ref Product, indexed), `rating`, `comment`, `createdAt`
- [ ] Add DB indexes: `User.email`, `Product.category`, `Order.userId`, `Review.productId`
- [ ] Write model unit tests (Jest) for schema validations

### Week 3 — Auth APIs
- [ ] `POST /api/auth/register`: Zod validation, bcrypt hash, save user, return JWT
- [ ] `POST /api/auth/login`: Validate email/password, bcrypt compare, return JWT + user payload
- [ ] `GET /api/auth/google` + `GET /api/auth/google/callback`: Passport.js Google OAuth, upsert user by `googleId`, return JWT
- [ ] `GET /api/auth/me`: Protected, return current user profile
- [ ] `authMiddleware.js`: Verify Bearer JWT, attach `req.user`; RBAC: `requireAdmin` guard
- [ ] `rateLimiter.js`: 100 req/15min global; 5 req/15min on auth routes
- [ ] Write Jest tests for auth flow (register, login, invalid credentials, token expiry)

### Week 4 — Product CRUD APIs + Cloudinary
- [ ] Configure Cloudinary SDK (`config/cloudinary.js`), multer-storage-cloudinary
- [ ] `cloudinaryUpload.js` util: upload buffer → Cloudinary, return URL array
- [ ] `GET /api/products`: query params `category`, `size`, `color`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`; paginated response with meta
- [ ] `GET /api/products/:id`: populate ratings, return full product doc
- [ ] `POST /api/admin/products`: admin-only, multipart form, upload images to Cloudinary, create product
- [ ] `PUT /api/admin/products/:id`: update fields, handle image replacement
- [ ] `DELETE /api/admin/products/:id`: soft-delete or hard-delete, remove Cloudinary assets
- [ ] Joi/Zod schema for product create/update
- [ ] Write integration tests for product endpoints (mock Cloudinary)

### Week 5 — Hardening & Handoff to Frontend
- [ ] `errorHandler.js`: centralized async error wrapper, structured JSON error responses
- [ ] Global 404 handler
- [ ] API response envelope: `{ success, data, message, pagination }`
- [ ] Export and share **Postman collection** (auth + product routes) with Member 4
- [ ] Code review of Member 2's routes that consume M1's models
- [ ] Fix any schema/model issues raised by Member 2 during Cart/Order integration
- [ ] Ensure all M1 routes return consistent response shapes matching API contract

### Week 6–7 — Support & Review
- [ ] Assist Member 2 with model edge cases (stock update, order status enum)
- [ ] Review PRs from Member 2 that touch shared middleware/models
- [ ] Final index audit on MongoDB Atlas

### Week 8 — Final
- [ ] Merge `feature/m1-auth-products` → `dev`
- [ ] Smoke-test all M1 endpoints on deployed Render environment
- [ ] Update `.env.example` for any new variables added by other members

---

## 5. API Endpoints & DB Collections Owned

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/google` | Public |
| GET | `/api/auth/google/callback` | Public |
| GET | `/api/auth/me` | JWT |
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/admin/products` | Admin |
| PUT | `/api/admin/products/:id` | Admin |
| DELETE | `/api/admin/products/:id` | Admin |

**Collections Owned (schema only; other members query, M1 defines):**
`Users`, `Products`, `Orders`, `Cart`, `Coupons`, `Reviews`

---

## 6. Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/merchstore
JWT_SECRET=<strong_random_secret>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<from_google_console>
GOOGLE_CLIENT_SECRET=<from_google_console>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
CLIENT_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 7. Dependencies on Other Members

| Dependency | From | By Week |
|------------|------|---------|
| None — M1 is the foundation | — | — |
| M2 needs `authMiddleware`, all models | M1 → M2 | Week 3 end |
| M3/M4 need auth API live on dev | M1 | Week 4 end |
| API contract doc shared with all | M1 → all | Week 1 end |

---

## 8. Definition of Done

- [ ] All 6 Mongoose models merged to `dev`, unit-tested, indexed
- [ ] Auth endpoints (register, login, Google OAuth, /me) return correct JWT
- [ ] Product CRUD endpoints work with Cloudinary image upload
- [ ] `authMiddleware` and `requireAdmin` guard tested and exported
- [ ] `.env.example` fully documented
- [ ] ESLint passes with zero errors
- [ ] Jest coverage ≥ 70% for auth + model validation
- [ ] Postman collection for M1 routes shared with M4
- [ ] No merge conflicts on `dev`; PR approved by at least 1 reviewer

---

## 9. Suggested npm Packages

```json
{
  "dependencies": [
    "express",
    "mongoose",
    "bcryptjs",
    "jsonwebtoken",
    "passport",
    "passport-google-oauth20",
    "passport-jwt",
    "cloudinary",
    "multer",
    "multer-storage-cloudinary",
    "cors",
    "helmet",
    "express-rate-limit",
    "morgan",
    "dotenv",
    "zod"
  ],
  "devDependencies": [
    "jest",
    "supertest",
    "nodemon",
    "eslint",
    "prettier"
  ]
}
```

---
---

# PART 2 — Member 2: Backend Transactions (Cart, Orders, Stripe, WebSockets, Coupons, Reviews, Inventory, Analytics)

## 1. Role / Title
**Member 2 — Backend Engineer: Transactions, Payments & Real-Time**

---

## 2. Owned Modules / Features
- Cart APIs (add, update, remove, get)
- Order APIs (create, get by user, admin list)
- Stripe payment integration (Payment Intent, webhook)
- Cash on Delivery (COD) logic
- Order status real-time tracking via WebSockets (Socket.io)
- Coupon validation API
- Review & Rating API
- Inventory low-stock cron job + Nodemailer email alert
- Admin analytics / revenue API

---

## 3. Owned Folder / File Structure

```
server/
├── controllers/
│   ├── cartController.js      ✅ M2
│   ├── orderController.js     ✅ M2
│   ├── paymentController.js   ✅ M2
│   ├── couponController.js    ✅ M2
│   ├── reviewController.js    ✅ M2
│   └── analyticsController.js ✅ M2
├── routes/
│   ├── cartRoutes.js          ✅ M2
│   ├── orderRoutes.js         ✅ M2
│   ├── paymentRoutes.js       ✅ M2
│   ├── couponRoutes.js        ✅ M2
│   ├── reviewRoutes.js        ✅ M2
│   └── analyticsRoutes.js     ✅ M2
├── validators/
│   ├── cartValidator.js       ✅ M2
│   ├── orderValidator.js      ✅ M2
│   └── reviewValidator.js     ✅ M2
├── services/
│   ├── stripeService.js       ✅ M2
│   ├── emailService.js        ✅ M2 (Nodemailer)
│   └── inventoryService.js    ✅ M2
├── cron/
│   └── lowStockCron.js        ✅ M2
├── socket/
│   └── orderSocket.js         ✅ M2
└── utils/
    └── analyticsHelpers.js    ✅ M2
```

> **Rule:** M2 imports M1's models and middleware — never edits them. Raise schema change requests to M1 via PR comment or team channel.

---

## 4. Step-by-Step Task Checklist (8-Week Timeline)

### Week 1 — Onboarding & Contract
- [x] Clone repo created by M1, run project locally
- [x] Review API contract document; contribute Cart/Order/Payment/Review shapes
- [x] Set up personal `.env` with Stripe test keys, SMTP creds

### Week 2–3 — Dependency Wait + Cart APIs (starts after M1 delivers models, Week 2)
- [x] `POST /api/cart/add`: find or create Cart doc for user, push/update item `{productId, qty, size}`; validate stock availability against `Product.sizes[].stock`
- [x] `PUT /api/cart/update`: update qty or size for a cart item; re-validate stock
- [x] `DELETE /api/cart/remove/:productId`: remove item from cart
- [x] `GET /api/cart`: get current user's cart, populate product name/price/images
- [x] `DELETE /api/cart/clear`: clear entire cart (called after order success)
- [x] Zod validation for all cart inputs
- [ ] Cart unit tests with Jest (mock Product model)

### Week 3–4 — Order APIs + Payment
- [x] `POST /api/orders/create`:
  - [x] Validate cart not empty
  - [x] Check stock for each item (decrement `Product.sizes[].stock`)
  - [x] Calculate total (apply coupon discount if `couponCode` provided)
  - [x] If `paymentMethod === 'stripe'`: call `stripeService.createPaymentIntent(amount)`; return `clientSecret` to frontend
  - [x] If `paymentMethod === 'cod'`: set `paymentStatus: 'pending'`, create Order immediately
  - [x] Save Order doc; call `cartController.clearCart`
- [x] `POST /api/payment/webhook`: verify Stripe signature; on `payment_intent.succeeded` → update `Order.paymentStatus = 'paid'`, emit Socket event
- [x] `GET /api/orders/:userId`: user's own orders (paginated, sorted newest first)
- [x] `GET /api/orders/single/:orderId`: single order detail
- [x] `GET /api/admin/orders`: all orders, filterable by `status`, `paymentMethod`, date range
- [x] `PUT /api/admin/orders/:id/status`: update Order status enum; emit WebSocket event to specific user room
- [x] Zod validation for order creation input
- [ ] Integration tests for order creation (mock Stripe, mock DB transactions)

### Week 4 — WebSocket / Real-Time Order Tracking
- [x] `socket/orderSocket.js`: initialize Socket.io on `server.js` (M1 must expose `httpServer`); handle user joining room `order:<orderId>`
- [x] Emit `ORDER_STATUS_UPDATED` event with `{ orderId, status, timestamp }` whenever admin updates status
- [x] Emit `PAYMENT_CONFIRMED` on Stripe webhook success
- [x] Test: open two browser tabs, confirm real-time status propagation

### Week 5 — Coupon, Reviews, Inventory Cron
- [x] `POST /api/coupons/validate`: find coupon by `code`, check `expiresAt > now`, check `usedCount < usageLimit`; return `discountPct` or error
- [x] Coupon application: after validation, increment `usedCount` atomically on order creation
- [x] `POST /api/reviews/:productId`: create Review doc; recalculate `Product.averageRating` using aggregation pipeline, update Product doc
- [x] `GET /api/reviews/:productId`: paginated list, sorted by newest/highest rating
- [x] `cron/lowStockCron.js`: node-cron schedule (`0 8 * * *`); query `Product.sizes` where `stock < 10`; send email via `emailService.js` (Nodemailer + Gmail SMTP) with product name, SKU, stock level
- [x] `emailService.js`: reusable `sendEmail(to, subject, html)` function; use HTML template for low-stock alert

### Week 5–6 — Analytics API
- [x] `GET /api/admin/analytics/revenue`: MongoDB aggregation pipeline; group Orders by week/month; return `{ period, revenue, orderCount, avgOrderValue }`
- [x] `GET /api/admin/analytics/top-products`: aggregate order items, group by productId, sum qty sold
- [x] `GET /api/admin/analytics/summary`: total revenue, total orders, total users count (quick stats for dashboard cards)

### Week 6–7 — Hardening
- [x] Add rate limiting on `/api/orders/create` (10 req/min per user)
- [ ] Stripe idempotency keys to prevent duplicate charges
- [x] Stock decrement in MongoDB transaction (`session.withTransaction`) to prevent race conditions
- [ ] Write full Postman collection for M2 routes; hand off to M4

### Week 8 — Final
- [ ] Merge `feature/m2-transactions` → `dev`
- [ ] Smoke-test all endpoints on Render
- [ ] Verify WebSocket events reach frontend (coordinate with M3/M4)

---

## 5. API Endpoints & DB Collections Owned

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/cart` | JWT |
| POST | `/api/cart/add` | JWT |
| PUT | `/api/cart/update` | JWT |
| DELETE | `/api/cart/remove/:productId` | JWT |
| DELETE | `/api/cart/clear` | JWT |
| POST | `/api/orders/create` | JWT |
| GET | `/api/orders/:userId` | JWT |
| GET | `/api/orders/single/:orderId` | JWT |
| GET | `/api/admin/orders` | Admin |
| PUT | `/api/admin/orders/:id/status` | Admin |
| POST | `/api/payment/webhook` | Stripe sig |
| POST | `/api/coupons/validate` | JWT |
| POST | `/api/reviews/:productId` | JWT |
| GET | `/api/reviews/:productId` | Public |
| GET | `/api/admin/analytics/revenue` | Admin |
| GET | `/api/admin/analytics/top-products` | Admin |
| GET | `/api/admin/analytics/summary` | Admin |

**Collections Operated (M1 defines schema; M2 reads/writes):**
`Cart`, `Orders`, `Coupons`, `Reviews` + stock fields on `Products`

---

## 6. Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=merch@geetauniversity.ac.in
SMTP_PASS=<app_password>
ALERT_EMAIL=admin@geetauniversity.ac.in
LOW_STOCK_THRESHOLD=10
CRON_SCHEDULE="0 8 * * *"
CLIENT_URL=http://localhost:5173
```

---

## 7. Dependencies on Other Members

| Dependency | From | By Week |
|------------|------|---------|
| All 6 Mongoose models exported | M1 | Week 2 end |
| `authMiddleware` + `requireAdmin` exported | M1 | Week 2 end |
| `server.js` must expose `httpServer` for Socket.io | M1 | Week 3 end |
| Frontend calls Stripe `clientSecret` for payment form | M3 (week 5) | — |
| Admin status update UI emits trigger | M4 (week 5–6) | — |

---

## 8. Definition of Done

- [ ] Cart CRUD endpoints tested and returning correct populated responses
- [ ] Order creation handles both Stripe and COD paths correctly
- [ ] Stripe webhook verified (use Stripe CLI locally)
- [ ] WebSocket emits `ORDER_STATUS_UPDATED` on admin action — verified with `wscat` or browser test
- [ ] Coupon validation rejects expired/exhausted codes
- [ ] Review creation updates `Product.averageRating`
- [ ] Low-stock cron sends email in test (set threshold high temporarily)
- [ ] Analytics API returns correct aggregated revenue by period
- [ ] Stock decrement is atomic (MongoDB transaction)
- [ ] Jest coverage ≥ 70% for order + payment controllers
- [ ] Postman collection for all M2 routes delivered to M4
- [ ] PR approved, `dev` merge clean

---

## 9. Suggested npm Packages

```json
{
  "dependencies": [
    "stripe",
    "socket.io",
    "node-cron",
    "nodemailer",
    "mongoose"
  ],
  "devDependencies": [
    "jest",
    "supertest",
    "@types/nodemailer"
  ]
}
```

---
---

# PART 3 — Member 3: Frontend Customer-Facing (React, Redux, Auth, Catalog, Cart, Checkout, User Dashboard)

## 1. Role / Title
**Member 3 — Frontend Engineer: Customer-Facing UI & State Management**

---

## 2. Owned Modules / Features
- React + Vite app scaffold, Tailwind CSS config, global routing
- Redux Toolkit store: auth slice, cart slice, product slice, order slice
- Auth pages: Login, Register (+ Google OAuth redirect)
- Home / Landing page
- Product Listing page (filters, sort, pagination)
- Product Detail page (image slider, size selector, stock badge)
- Cart page (quantity update, remove, subtotal)
- Checkout flow (address form, payment method select, Stripe Elements)
- Order Confirmation page
- User Dashboard (profile edit, order history, address management)
- Responsive UI: mobile-first Tailwind, WCAG 2.1 AA compliance

---

## 3. Owned Folder / File Structure

```
client/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   └── store.js               ✅ M3
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.js       ✅ M3
│   │   │   └── authAPI.js         ✅ M3
│   │   ├── cart/
│   │   │   ├── cartSlice.js       ✅ M3
│   │   │   └── cartAPI.js         ✅ M3
│   │   ├── products/
│   │   │   ├── productSlice.js    ✅ M3
│   │   │   └── productAPI.js      ✅ M3
│   │   └── orders/
│   │       ├── orderSlice.js      ✅ M3
│   │       └── orderAPI.js        ✅ M3
│   ├── pages/
│   │   ├── Home.jsx               ✅ M3
│   │   ├── Login.jsx              ✅ M3
│   │   ├── Register.jsx           ✅ M3
│   │   ├── ProductList.jsx        ✅ M3
│   │   ├── ProductDetail.jsx      ✅ M3
│   │   ├── Cart.jsx               ✅ M3
│   │   ├── Checkout.jsx           ✅ M3
│   │   ├── OrderConfirm.jsx       ✅ M3
│   │   └── UserDashboard.jsx      ✅ M3
│   ├── components/
│   │   ├── Navbar.jsx             ✅ M3
│   │   ├── Footer.jsx             ✅ M3
│   │   ├── ProductCard.jsx        ✅ M3
│   │   ├── FilterSidebar.jsx      ✅ M3
│   │   ├── ImageSlider.jsx        ✅ M3
│   │   ├── SizeSelector.jsx       ✅ M3
│   │   ├── CartItem.jsx           ✅ M3
│   │   ├── AddressForm.jsx        ✅ M3
│   │   ├── StripePaymentForm.jsx  ✅ M3
│   │   ├── OrderStatusTracker.jsx ✅ M3 (Socket.io client)
│   │   ├── Loader.jsx             ✅ M3
│   │   └── ProtectedRoute.jsx     ✅ M3
│   ├── hooks/
│   │   ├── useAuth.js             ✅ M3
│   │   └── useSocket.js           ✅ M3
│   ├── utils/
│   │   ├── api.js                 ✅ M3 (Axios instance)
│   │   └── helpers.js             ✅ M3
│   ├── styles/
│   │   └── index.css              ✅ M3
│   ├── App.jsx                    ✅ M3
│   └── main.jsx                   ✅ M3
├── index.html                     ✅ M3
├── vite.config.js                 ✅ M3
├── tailwind.config.js             ✅ M3
└── package.json                   ✅ M3
```

> **Rule:** M4 imports M3's `store.js`, `authSlice`, `cartSlice` — never edits them. Admin pages live only in M4's files.

---

## 4. Step-by-Step Task Checklist (8-Week Timeline)

### Week 1 — Scaffold & Design System
- [x] `npm create vite@latest client -- --template react`
- [x] Install & configure Tailwind CSS v3, PostCSS, Autoprefixer
- [x] Define Tailwind theme: GU brand colors (`primary`, `secondary`, `accent`), font (`Inter` via Google Fonts), spacing scale, breakpoints
- [x] Install React Router v6, Redux Toolkit, Axios, React Query (optional layer on top)
- [x] Set up `vite.config.js` proxy: `/api` → `http://localhost:5000`
- [x] Create `App.jsx` with `<BrowserRouter>`, define all route paths as placeholders
- [x] Build `Navbar.jsx` (logo, nav links, cart icon with badge, user avatar menu) + `Footer.jsx`
- [x] `Loader.jsx` spinner and `ErrorBoundary.jsx`
- [x] Create global Tailwind utility classes (`.btn-primary`, `.btn-outline`, `.card`, `.input-field`)
- [x] Commit skeleton app to `feature/m3-frontend`

### Week 2 — Redux Store + Auth Pages
- [x] `store.js`: configure Redux store with `authSlice`, `cartSlice`, `productSlice`, `orderSlice`
- [x] `authSlice.js`: state `{user, token, loading, error}`; actions `setCredentials`, `logout`
- [x] `authAPI.js`: `registerUser`, `loginUser` (RTK Query or createAsyncThunk hitting M1 endpoints)
- [x] `utils/api.js`: Axios instance with `baseURL`, request interceptor to attach Bearer token from Redux state
- [x] `Login.jsx`: email/password form, validation (React Hook Form + Zod), error display, "Login with Google" button (redirect to `GET /api/auth/google`)
- [x] `Register.jsx`: name/email/password/confirmPassword fields, university email validation (`@geeta.ac.in`), success redirect to `/login`
- [x] `ProtectedRoute.jsx`: HOC checking `auth.token`; redirect to `/login` if absent
- [x] `useAuth.js` hook: expose `user`, `isLoggedIn`, `logout` helpers
- [x] Persist auth token in `localStorage` via Redux middleware

### Week 3 — Home Page + Product Listing
- [x] `Home.jsx`: hero banner (full-width gradient, GU tagline), featured categories grid, top-rated products carousel (fetch `/api/products?sort=rating&limit=8`)
- [x] `ProductCard.jsx`: product image (lazy-loaded), name, price, rating stars, "Add to Cart" quick-action
- [x] `productSlice.js` + `productAPI.js`: async thunks for `fetchProducts(filters)`, `fetchProductById(id)` hitting M1 endpoints
- [x] `ProductList.jsx`:
  - [x] Left sidebar `FilterSidebar.jsx`: category checkboxes, size multi-select, price range slider, color picker
  - [x] Product grid (responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop)
  - [x] Top bar: sort dropdown (price asc/desc, rating, newest), results count
  - [x] Pagination component (page numbers, prev/next)
  - [x] URL sync: filters reflected in query string (`?category=tshirts&size=M`)

### Week 4 — Product Detail + Cart Page
- [x] `ImageSlider.jsx`: thumbnail strip + main image; Cloudinary URL transformation for thumbnails
- [x] `SizeSelector.jsx`: display available sizes as toggle buttons; disabled + "Out of Stock" badge if `stock === 0`
- [x] `ProductDetail.jsx`: image slider, product name, price, rating summary, size selector, quantity input, "Add to Cart" button, product description accordion, size chart modal
- [x] `cartSlice.js`: state `{items[], loading}`; sync to backend on each mutation (optimistic update)
- [x] `cartAPI.js`: `addToCart`, `updateCartItem`, `removeCartItem`, `fetchCart`
- [x] `Cart.jsx`:
  - [x] Item list with `CartItem.jsx` (image, name, size, qty stepper, remove)
  - [x] Order summary sidebar (subtotal, estimated delivery)
  - [x] "Proceed to Checkout" CTA (disabled if cart empty)
  - [x] Empty cart illustration + "Shop Now" link

### Week 5 — Checkout + Stripe + Order Confirmation
- [x] `AddressForm.jsx`: React Hook Form; fields: full name, phone, street, city, state, pincode; saved addresses dropdown for returning users
- [x] `Checkout.jsx`:
  - [x] Step 1: Address selection/entry
  - [x] Step 2: Payment method (Stripe / COD radio)
  - [x] Step 3: Order review (item list, total, coupon field — renders `CouponInput` from M4 if available, else placeholder)
  - [x] On "Place Order": call `POST /api/orders/create` → if Stripe, receive `clientSecret`
- [x] `StripePaymentForm.jsx`: `@stripe/react-stripe-js` `<CardElement>`, `confirmCardPayment(clientSecret)`; show spinner on processing
- [x] `orderSlice.js` + `orderAPI.js`: `createOrder`, `fetchUserOrders`, `fetchOrderById`
- [x] `OrderConfirm.jsx`: success animation (Lottie / CSS), order ID, summary table, "Track Order" button
- [x] `OrderStatusTracker.jsx`: show steps `Placed → Packed → Shipped → Delivered` as progress bar; connect Socket.io via `useSocket.js` hook to room `order:<orderId>`; animate active step on `ORDER_STATUS_UPDATED` event

### Week 6 — User Dashboard
- [x] `UserDashboard.jsx`: tabbed layout — Profile, Order History, Manage Addresses
- [x] Profile tab: edit name, phone; read-only email; "Change Password" modal
- [x] Order History tab: table of orders with status badge, "View Details" side drawer
- [x] Addresses tab: add/edit/delete addresses; set default address
- [x] Mobile-responsive dashboard using Tailwind flex/grid
- [x] `useSocket.js` hook: initialize Socket.io client, join room by orderId, cleanup on unmount

### Week 7 — Accessibility + Polish
- [x] Audit all pages with axe-core or Lighthouse: fix WCAG 2.1 AA violations
- [x] Add `aria-label`, `aria-live`, `role` attributes to dynamic regions
- [x] Keyboard navigation: focus trap in modals, skip-to-content link
- [x] Lazy loading for product images (`loading="lazy"` + IntersectionObserver)
- [x] Skeleton loading screens (Tailwind pulse animation) for product list, cart
- [x] Toast notifications (react-hot-toast) for cart actions, order errors, auth events
- [x] Smooth page transitions (Framer Motion fade)
- [x] Test all flows on mobile viewport (375px) in Chrome DevTools

### Week 8 — Final
- [ ] Merge `feature/m3-frontend` → `dev`
- [ ] Coordinate with M4 for admin route integration (M4 wraps into same React app)
- [ ] Smoke-test all customer flows end-to-end on deployed Vercel URL

---

## 5. API Endpoints Consumed by M3

| Endpoint | Used In |
|----------|---------|
| `POST /api/auth/register` | Register.jsx |
| `POST /api/auth/login` | Login.jsx |
| `GET /api/auth/google` | Login.jsx |
| `GET /api/auth/me` | ProtectedRoute + store hydration |
| `GET /api/products` | ProductList.jsx |
| `GET /api/products/:id` | ProductDetail.jsx |
| `GET/POST/PUT/DELETE /api/cart/*` | Cart.jsx, ProductDetail.jsx |
| `POST /api/orders/create` | Checkout.jsx |
| `GET /api/orders/:userId` | UserDashboard.jsx |
| `GET /api/orders/single/:orderId` | OrderConfirm.jsx |

---

## 6. Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_<key>
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=<client_id>
```

---

## 7. Dependencies on Other Members

| Dependency | From | By Week |
|------------|------|---------|
| `POST /api/auth/*` live on dev server | M1 | Week 2 end |
| `GET /api/products` live, Cloudinary images working | M1 | Week 3 end |
| Cart + Order APIs live | M2 | Week 4 end |
| Stripe `clientSecret` returned on order create | M2 | Week 5 |
| Socket.io server running, `ORDER_STATUS_UPDATED` event defined | M2 | Week 4 end |
| Admin pages (M4) reuse M3's `store.js` — no store conflicts | M4 | Week 5+ |

---

## 8. Definition of Done

- [ ] All customer pages render correctly on mobile (375px) and desktop (1440px)
- [ ] Auth flow: register → login → protected routes → logout
- [ ] Product filtering + pagination works against live API
- [ ] Cart CRUD syncs to backend; Redux state consistent
- [ ] Stripe payment form completes test payment (card `4242 4242 4242 4242`)
- [ ] COD path creates order and shows confirmation
- [ ] Order status tracker updates in real-time via WebSocket
- [ ] User dashboard shows real order history and allows address management
- [ ] Lighthouse score ≥ 85 (Performance), ≥ 90 (Accessibility) on Product List page
- [ ] Zero ESLint errors; Prettier formatted
- [ ] PR approved by at least 1 reviewer; clean merge to `dev`

---

## 9. Suggested npm Packages

```json
{
  "dependencies": [
    "react",
    "react-dom",
    "react-router-dom",
    "@reduxjs/toolkit",
    "react-redux",
    "axios",
    "react-hook-form",
    "@hookform/resolvers",
    "zod",
    "@stripe/react-stripe-js",
    "@stripe/stripe-js",
    "socket.io-client",
    "react-hot-toast",
    "framer-motion",
    "swiper",
    "react-icons"
  ],
  "devDependencies": [
    "vite",
    "@vitejs/plugin-react",
    "tailwindcss",
    "postcss",
    "autoprefixer",
    "eslint",
    "prettier"
  ]
}
```

---
---

# PART 4 — Member 4: Frontend Admin + Integration, Testing, Deployment

## 1. Role / Title
**Member 4 — Frontend Admin Engineer & DevOps: Admin UI, Integration Testing, Deployment**

---

## 2. Owned Modules / Features
- Admin Products table (add/edit/delete modal, Cloudinary image upload from UI)
- Admin Orders table (status update dropdown, filters by status/date)
- Admin Analytics dashboard (Chart.js / Recharts revenue charts, top-products bar, summary cards)
- Reviews & Ratings UI (product detail review list + submission form)
- Coupon entry / validation UI on Checkout page
- End-to-end API integration testing (Postman collection finalization)
- Jest + React Testing Library unit tests for critical components
- Deployment pipeline: Frontend → Vercel, Backend → Render, DB → MongoDB Atlas
- README.md + architecture diagram

---

## 3. Owned Folder / File Structure

```
client/src/
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.jsx      ✅ M4
│   │   ├── AdminProducts.jsx       ✅ M4
│   │   ├── AdminOrders.jsx         ✅ M4
│   │   └── AdminAnalytics.jsx      ✅ M4
│   └── (ProductDetail.jsx — M4 adds Reviews section, not replaces file)
├── components/
│   ├── admin/
│   │   ├── ProductFormModal.jsx    ✅ M4
│   │   ├── OrderStatusSelect.jsx   ✅ M4
│   │   ├── RevenueChart.jsx        ✅ M4
│   │   ├── TopProductsChart.jsx    ✅ M4
│   │   └── StatCard.jsx            ✅ M4
│   ├── ReviewList.jsx              ✅ M4
│   ├── ReviewForm.jsx              ✅ M4
│   └── CouponInput.jsx             ✅ M4
├── features/
│   └── admin/
│       ├── adminSlice.js           ✅ M4
│       └── adminAPI.js             ✅ M4
├── routes/
│   └── AdminRoutes.jsx             ✅ M4 (admin-only ProtectedRoute wrapper)

postman/
└── GeetatUniversity_MerchStore.postman_collection.json  ✅ M4

docs/
├── README.md                       ✅ M4
└── architecture-diagram.png        ✅ M4

.github/
├── workflows/
│   ├── deploy-frontend.yml         ✅ M4
│   └── deploy-backend.yml          ✅ M4
└── pull_request_template.md        ✅ M4
```

> **Rule:** M4 imports M3's `store.js` (never duplicates store). M4 adds admin routes to M3's `App.jsx` via a PR, not by rewriting the file. Admin API calls use M3's Axios instance from `utils/api.js`.

---

## 4. Step-by-Step Task Checklist (8-Week Timeline)

### Week 1 — Setup & Contracts
- [ ] Clone repo (M3 creates it); verify Vite + Tailwind run locally
- [ ] Review API contract doc; contribute Admin endpoint request/response shapes
- [ ] Create PR template (`.github/pull_request_template.md`): checklist for lint, tests, API contract check
- [ ] Scaffold `src/pages/admin/` and `src/components/admin/` directories
- [ ] Set up `AdminRoutes.jsx`: wrap admin pages in `ProtectedRoute` with `role === 'admin'` check

### Week 2–3 — Admin Products UI (after M1 Product APIs live, Week 4)
> (Use mock data / MSW during Week 2–3 while backend not yet ready)
- [ ] `AdminProducts.jsx`: data table (react-table or custom) with columns: image, name, category, price, stock, actions
- [ ] Sorting + search bar (client-side on fetched data)
- [ ] `ProductFormModal.jsx`:
  - Add Product mode: form with name, description, category, price, sizes (dynamic add/remove rows with size + stock), multi-image upload (drag-and-drop, preview, calls `POST /api/admin/products`)
  - Edit Product mode: pre-fill fields, handle image replacement
  - Delete: confirm dialog, call `DELETE /api/admin/products/:id`
- [ ] Image upload UI: `<input type="file" multiple>`, preview thumbnails, upload to backend (backend calls Cloudinary)
- [ ] `adminSlice.js` + `adminAPI.js`: RTK async thunks for `fetchAdminProducts`, `createProduct`, `updateProduct`, `deleteProduct`

### Week 4–5 — Admin Orders UI
- [ ] `AdminOrders.jsx`: paginated table — Order ID, customer name, items count, total, payment method, status badge, date
- [ ] Filter bar: by `status` (multi-select chips), `paymentMethod`, date range picker
- [ ] `OrderStatusSelect.jsx`: dropdown with enum values `[Placed, Packed, Shipped, Delivered, Cancelled]`; on change → `PUT /api/admin/orders/:id/status` → optimistic UI update + toast
- [ ] Order detail expansion row or side drawer: full item list, delivery address, payment info
- [ ] Realtime: subscribe to Socket.io `ORDER_STATUS_UPDATED` (same `useSocket` hook from M3) to refresh order row status without page reload

### Week 5 — Reviews UI + Coupon Input
- [ ] `ReviewList.jsx`: star-rating display (filled/empty stars), reviewer name, comment, date; paginated (`GET /api/reviews/:productId`)
- [ ] `ReviewForm.jsx`: star selector (interactive), textarea, submit (`POST /api/reviews/:productId`); show only if user is logged in and has purchased the product
- [ ] Integrate `ReviewList` + `ReviewForm` into M3's `ProductDetail.jsx` (open PR on M3's file — add a clearly marked section at bottom, minimal conflict)
- [ ] `CouponInput.jsx`: text input + "Apply" button; calls `POST /api/coupons/validate`; shows success (discount %) or error toast; emits discount value up to `Checkout.jsx` via Redux or callback prop
- [ ] Integrate `CouponInput` into M3's `Checkout.jsx` step 3 (PR on M3's file — add single import + component instance)

### Week 5–6 — Analytics Dashboard
- [ ] `AdminAnalytics.jsx`: layout with 3 stat cards + 2 charts
- [ ] `StatCard.jsx`: animated counter (total revenue, total orders, avg order value) from `GET /api/admin/analytics/summary`
- [ ] `RevenueChart.jsx`: Recharts `<AreaChart>` for weekly/monthly revenue; toggle buttons for period; data from `GET /api/admin/analytics/revenue`
- [ ] `TopProductsChart.jsx`: Recharts `<BarChart>` for top 10 selling products; data from `GET /api/admin/analytics/top-products`
- [ ] Responsive chart containers (Recharts `<ResponsiveContainer>`)
- [ ] Loading skeletons for charts while data fetches

### Week 6 — Integration Testing + Postman
- [ ] Gather Postman collections from M1 and M2
- [ ] Merge and structure final `GeetatUniversity_MerchStore.postman_collection.json`:
  - Folder per domain: Auth, Products, Cart, Orders, Payment, Coupons, Reviews, Analytics
  - Environment variables: `{{baseUrl}}`, `{{authToken}}`, `{{adminToken}}`
  - Pre-request scripts: auto-set `authToken` from login response
  - Test scripts: assert status codes, response shape, required fields
- [ ] Run Postman Newman: `newman run collection.json -e env.json` — all tests pass
- [ ] RTL unit tests for: `ProductCard`, `CartItem`, `OrderStatusTracker`, `RevenueChart`, `CouponInput`
- [ ] Verify end-to-end flow: Register → Browse → Add to Cart → Checkout (Stripe test) → Order Confirmation → Admin updates status → Customer sees real-time update

### Week 7 — Deployment
- [ ] **MongoDB Atlas**: confirm indexes, IP whitelist `0.0.0.0/0` for Render, create `prod` user with limited permissions
- [ ] **Backend on Render**:
  - Create Web Service, connect GitHub `main` branch
  - Set all env vars in Render dashboard
  - Set build command: `npm install`, start: `node server.js`
  - Test `/api/health` endpoint responds 200
- [ ] **Frontend on Vercel**:
  - Import GitHub repo, set root directory to `client/`
  - Set env vars: `VITE_API_BASE_URL=https://<render-url>`, `VITE_STRIPE_PUBLISHABLE_KEY`
  - Test production build: `npm run build` locally first
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard → `https://<render-url>/api/payment/webhook`
- [ ] CORS: update `CLIENT_URL` on Render to Vercel production URL
- [ ] Smoke-test all critical paths on production URLs

### Week 8 — Documentation + Final
- [ ] `docs/README.md`:
  - Project overview, tech stack badge table
  - Local setup instructions (clone, `cp .env.example .env`, `npm install`, `npm run dev`)
  - Folder structure overview
  - API documentation link (Postman public link)
  - Team members + roles
  - Deployment URLs
- [ ] `docs/architecture-diagram.png`: draw.io or Excalidraw diagram showing Client → Vercel, API → Render, DB → Atlas, Cloudinary, Stripe, Socket.io, Nodemailer
- [ ] Final PR: merge all `feature/*` branches → `dev` → `main`
- [ ] Tag release `v1.0.0` on `main`

---

## 5. API Endpoints Consumed / Tested by M4

| Endpoint | Used In |
|----------|---------|
| `GET /api/admin/products` (all) | AdminProducts.jsx |
| `POST /api/admin/products` | ProductFormModal.jsx |
| `PUT /api/admin/products/:id` | ProductFormModal.jsx |
| `DELETE /api/admin/products/:id` | AdminProducts.jsx |
| `GET /api/admin/orders` | AdminOrders.jsx |
| `PUT /api/admin/orders/:id/status` | OrderStatusSelect.jsx |
| `GET /api/admin/analytics/revenue` | RevenueChart.jsx |
| `GET /api/admin/analytics/top-products` | TopProductsChart.jsx |
| `GET /api/admin/analytics/summary` | StatCard.jsx |
| `POST /api/reviews/:productId` | ReviewForm.jsx |
| `GET /api/reviews/:productId` | ReviewList.jsx |
| `POST /api/coupons/validate` | CouponInput.jsx |

---

## 6. Environment Variables

```env
# Inherit all VITE_ vars from M3's .env
VITE_API_BASE_URL=https://<render-backend-url>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_<key>
VITE_SOCKET_URL=https://<render-backend-url>

# Render (Backend)
NODE_ENV=production
MONGO_URI=<atlas_prod_uri>
STRIPE_SECRET_KEY=sk_live_<key>
STRIPE_WEBHOOK_SECRET=whsec_<prod_key>
CLIENT_URL=https://<vercel-frontend-url>
```

---

## 7. Dependencies on Other Members

| Dependency | From | By Week |
|------------|------|---------|
| React app scaffold, Tailwind, store.js, Axios instance | M3 | Week 1–2 |
| `authMiddleware` + `requireAdmin` for `AdminRoutes.jsx` | M1 | Week 2 end |
| All admin API endpoints live | M1 + M2 | Week 4–5 |
| M3's `ProductDetail.jsx` stable before adding Reviews section | M3 | Week 5 |
| M3's `Checkout.jsx` stable before adding `CouponInput` | M3 | Week 5 |
| M2's Postman collection for M2 routes | M2 | Week 6 |
| M1's Postman collection for M1 routes | M1 | Week 5 |
| Backend deployed on Render | M1 + M2 | Week 7 |

---

## 8. Definition of Done

- [ ] Admin Products CRUD fully functional: add with image upload, edit, delete with confirmation
- [ ] Admin Orders table filters by status/date; status update reflects instantly (optimistic + Socket)
- [ ] Analytics charts render correct data with loading states and empty states
- [ ] `CouponInput` applies discount to checkout total correctly
- [ ] `ReviewList` and `ReviewForm` integrated into ProductDetail without breaking M3's existing UI
- [ ] Postman Newman run: 100% tests pass against deployed Render URL
- [ ] RTL unit tests pass for 5+ components
- [ ] Frontend deployed on Vercel; backend on Render; both communicate in production
- [ ] Stripe webhook verified in production (test with `stripe trigger`)
- [ ] README complete with architecture diagram, setup steps, deployment URLs
- [ ] `v1.0.0` tag on `main`; PR from `dev` → `main` approved by all 4 members

---

## 9. Suggested npm Packages

```json
{
  "dependencies": [
    "recharts",
    "react-table",
    "@tanstack/react-table",
    "react-dropzone",
    "react-datepicker",
    "react-select",
    "react-hot-toast"
  ],
  "devDependencies": [
    "@testing-library/react",
    "@testing-library/jest-dom",
    "@testing-library/user-event",
    "vitest",
    "newman",
    "msw"
  ]
}
```

---
---

# INTEGRATION & MERGE PLAN

## Git Branching Strategy

```
main          ← production-ready, tagged releases only
└── dev       ← integration branch, always runnable
    ├── feature/m1-auth-products      (Member 1)
    ├── feature/m2-transactions       (Member 2)
    ├── feature/m3-frontend           (Member 3)
    └── feature/m4-admin-integration  (Member 4)
```

- **Sub-feature branches** (optional, within each member's scope):
  `feature/m1-models`, `feature/m1-auth`, `feature/m1-cloudinary`
- **Branch protection on `main`**: require 2 PR approvals, CI pass (ESLint + Jest)
- **Branch protection on `dev`**: require 1 PR approval, CI pass
- **PR naming**: `[M1] feat: add Mongoose models and auth routes`
- **Merge strategy**: squash-merge feature → dev; merge commit dev → main

---

## Weekly Checkpoint Merge Schedule

| Week | Event | Branches Merging |
|------|-------|-----------------|
| **Week 1 end** | API contract document finalized & signed off by all 4 | No code merge yet |
| **Week 2 end** | M1 models + auth scaffolding ready | M1 merges `feature/m1-models` sub-branch → `dev` |
| **Week 3 end** | M1 Auth APIs + M3 React scaffold + Redux ready | M1 auth routes → `dev`; M3 scaffold → `dev` |
| **Week 4 end** | M1 Product APIs + M2 Cart APIs + M3 Product pages ready | All three → `dev` (coordinate sequentially, 1hr window) |
| **Week 5 end** | M2 Orders/Stripe/WebSocket + M3 Checkout + M4 Admin Products | Merge M2, M3 checkout, M4 admin → `dev` |
| **Week 6 end** | M2 Analytics/Coupons/Reviews + M4 Admin Orders/Analytics | Merge M2 and M4 remaining features → `dev` |
| **Week 7 end** | Deployment complete; all features on `dev` | `dev` → `main` (pre-release merge) |
| **Week 8 end** | Final QA, README, tag release | Tag `v1.0.0` on `main` |

---

## API Contract Agreement Process

### Before Each Integration Point

**Tool:** Shared Notion table or Google Sheet titled `MerchStore API Contract`

**Columns:** `Endpoint | Method | Request Body (JSON) | Response Shape (JSON) | Status Codes | Owner (M1/M2) | Consumer (M3/M4) | Status (Draft/Agreed/Implemented)`

### Mandatory Checkpoints

**Week 1 — Full Draft Contract**
- M1 documents: Auth endpoints, Product endpoints (request/response shapes, error formats)
- M2 documents: Cart, Order, Payment, Coupon, Review, Analytics endpoints
- M3/M4 review and flag any missing fields needed by UI
- All 4 sign off — **no changes to agreed fields without PR discussion**

**Week 3 — Auth + Product Contract Locked**
- M1 deploys auth routes to `dev`; M3 tests against live API
- If any field mismatch: raise GitHub Issue, M1 fixes within 24hrs
- Response envelope `{ success, data, message, pagination }` strictly enforced

**Week 4 — Cart + Order Contract Locked**
- M2 deploys cart/order routes; M3 tests Cart page and Checkout flow
- Stripe `clientSecret` field name confirmed (`data.clientSecret`)
- Socket event names confirmed: `ORDER_STATUS_UPDATED`, `PAYMENT_CONFIRMED`

**Week 5 — Admin + Analytics Contract Locked**
- M2 deploys analytics routes; M4 connects charts
- M1 confirms admin product endpoints; M4 connects product form modal
- Review endpoint fields confirmed: `rating` (1–5 int), `comment` (string)

### Breaking Change Policy
- Any breaking change to an agreed endpoint requires:
  1. GitHub Issue labeled `breaking-change`
  2. 24hr notice in team channel
  3. PR review by the consuming member (M3 or M4) before merge
  4. Version bump on the route (e.g., `/api/v2/...`) if change cannot be backward-compatible

---

*Plan prepared for Geeta University MerchStore — 4-Member Internship Team | 8-Week Sprint*
