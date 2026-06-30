# 🎓 Geeta University MerchStore

> Official e-commerce platform for authentic Geeta University branded merchandise.

[![Status](https://img.shields.io/badge/status-in--development-yellow)]()
[![License](https://img.shields.io/badge/license-Internal-blue)]()

---

## 📖 Overview

**Geeta University MerchStore** is a dedicated B2C e-commerce web application built exclusively for the Geeta University community. Students, faculty, and staff can browse, order, and pay for officially branded merchandise — notebooks, T-shirts, hoodies, caps, stationery, and collectibles — through a single authoritative platform, eliminating fake or low-quality items in circulation.

An integrated **Admin Dashboard** allows the store manager to handle inventory, pricing, order fulfillment, and sales analytics. The platform supports both **online payments (Stripe)** and **Cash on Delivery (COD)** for on-campus orders.

| | |
|---|---|
| **Client** | Geeta University Store Department |
| **Contact** | Store Manager / Dean of Student Affairs |
| **Project Type** | B2C E-Commerce Web Application |
| **Target Users** | Students, Faculty & Staff of Geeta University |
| **Timeline** | 8 Weeks |
| **Scope** | Academic / Internal Internship Project |

---

## ✨ Key Features

| Module | Description | Priority |
|---|---|---|
| 🔐 Auth | University email + Google OAuth login (JWT + bcrypt) | P0 |
| 🛍️ Product Catalog | Browse with filters (category, size, color) | P0 |
| 🖼️ Product Detail | Image gallery, size chart, stock status | P0 |
| 🛒 Cart & Checkout | Add/remove items, quantity update, address selection | P0 |
| 💳 Payments | Stripe online payment + Cash on Delivery | P0 |
| 📦 Order Tracking | Real-time status: Placed → Packed → Shipped → Delivered | P1 |
| 🧑‍💼 Admin Dashboard | Manage products, orders, and order status | P0 |
| 📊 Inventory Mgmt | Stock tracking with low-stock email alerts | P1 |
| ⭐ Reviews & Ratings | Verified-purchase product reviews | P2 |
| 🎟️ Coupon System | Event-based discount codes (e.g. `FEST20`) | P2 |
| 📈 Sales Reports | Weekly/monthly revenue analytics | P1 |
| 📱 Responsive UI | Full mobile & desktop support | P0 |

> **Priority key:** P0 = Must Have · P1 = Should Have · P2 = Nice to Have

---

## 🧱 Tech Stack
```
**Frontend** — React.js (Vite), React Router v6, Redux Toolkit, Tailwind CSS, Axios
**Backend** — Node.js, Express.js, REST API architecture, Multer
**Database** — MongoDB Atlas, Mongoose ODM
**Auth** — JWT, bcrypt.js, Role-Based Access Control (RBAC)
**Integrations** — Stripe (payments), Cloudinary (image CDN)
**Dev Tools** — VS Code, Postman, Git/GitHub, ESLint, Prettier, dotenv
**Deployment** — Frontend: Vercel/Netlify · Backend: Render.com · DB: MongoDB Atlas
```
---

## 🏗️ Architecture

```
                ┌──────────────────┐
                │   React Client    │
                │ (Vite + Redux)    │
                └─────────┬─────────┘
                          │ Axios (REST)
                ┌─────────▼─────────┐
                │  Express.js API    │
                │  (JWT + RBAC)      │
                └───┬───────────┬───┘
                    │           │
          ┌─────────▼───┐   ┌───▼────────┐
          │ MongoDB Atlas│   │  Stripe API │
          │ (Mongoose)   │   │  Cloudinary │
          └──────────────┘   └────────────┘
```

---

## 🗂️ Database Schema (Collections)

| Collection | Key Fields |
|---|---|
| **Users** | `name`, `email`, `password`, `role`, `addresses[]` |
| **Products** | `name`, `description`, `category`, `price`, `images[]`, `sizes[]`, `stock`, `ratings[]` |
| **Orders** | `userId`, `items[]`, `totalAmount`, `paymentMethod`, `status`, `address` |
| **Cart** | `userId`, `items[{productId, qty, size}]` |
| **Coupons** | `code`, `discountPct`, `expiresAt`, `usageLimit` |
| **Reviews** | `userId`, `productId`, `rating`, `comment`, `createdAt` |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user, issue JWT |
| `GET` | `/api/products` | List products with filters |
| `GET` | `/api/products/:id` | Get single product details |
| `POST` | `/api/cart/add` | Add item to cart |
| `PUT` | `/api/cart/update` | Update cart item quantity |
| `POST` | `/api/orders/create` | Place a new order |
| `GET` | `/api/orders/:userId` | Get order history for a user |
| `PUT` | `/api/admin/orders/:id/status` | Admin: update order status |
| `GET` | `/api/admin/analytics/revenue` | Admin: revenue analytics |
| `POST` | `/api/coupons/validate` | Validate a discount coupon |
| `POST` | `/api/reviews/:productId` | Submit a product review |

> Full request/response schemas available in the [Postman Collection](#) *(link to be added)*.

---

## 🖥️ Screens

- **Home / Landing** — Hero banner, featured products, category grid, announcements
- **Product Listing** — Filter sidebar, product grid, pagination, sort by price/rating
- **Product Detail** — Image slider, size selector, add-to-cart, related products
- **Cart** — Item list, quantity stepper, price breakdown
- **Checkout** — Address form, payment method, order summary
- **Order Confirmation** — Success state, order ID, estimated delivery
- **User Dashboard** — Profile, order history, saved addresses
- **Admin: Products** — Data table with add/edit/delete modal
- **Admin: Orders** — Order table with status update & filters
- **Admin: Analytics** — Revenue charts, top products, order count cards

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.x
- MongoDB Atlas account
- Stripe account (test mode keys)
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/<org>/geeta-university-merchstore.git
cd geeta-university-merchstore

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Run Locally

```bash
# Backend
cd server
npm run dev

# Frontend (in a new terminal)
cd client
npm run dev
```

App will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (API).

---



## 🔒 Security & Non-Functional Requirements

- **Security** — Stateless JWT auth, bcrypt hashing, HTTPS only, input validation (Joi/Zod), API rate limiting
- **Performance** — API response time < 500ms (95th percentile), DB indexing, lazy loading
- **Scalability** — Stateless backend (horizontally scalable), MongoDB Atlas managed scaling
- **Responsiveness** — Mobile-first (320px–1920px), tested on Chrome, Firefox, Safari
- **Accessibility** — WCAG 2.1 AA compliant, semantic HTML, keyboard navigation, ARIA labels
- **Code Quality** — ESLint + Prettier, Git branching (`main`/`dev`/`feature/*`), PR-based reviews
- **Testing** — Jest unit tests, manual E2E checklist, automated Postman collection

---

## 🤝 Contributing

1. Fork the repo and create your branch from `dev` (`feature/<name>`)
2. Commit changes with clear messages
3. Open a Pull Request against `dev` for review
4. Ensure ESLint/Prettier checks pass before requesting review

---

## 📄 License

Internal academic project — Geeta University. Not for external commercial distribution.

---
