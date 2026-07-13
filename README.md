# StockPilot Client

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query/latest)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=react-hook-form&logoColor=white)](https://react-hook-form.com/)
[![Zod](https://img.shields.io/badge/Zod-3068B2?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

> A highly polished, production-ready frontend client for StockPilot—a modern enterprise inventory management, batch expiry tracking, and sales analytics suite. Built with Next.js App Router, TypeScript, and Tailwind CSS.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Screens & Views](#-screens--views)
- [Folder Structure](#-folder-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [Technical Architecture & Integration](#-technical-architecture--integration)
  - [API Integration & Interceptors](#api-integration--interceptors)
  - [Role-Based Access Control](#role-based-access-control)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [For Recruiters](#-for-recruiters)

---

## 🚀 Project Overview

**StockPilot Client** is a state-of-the-art Single Page Application (SPA) designed to empower businesses with real-time stock control, batch expiration safeguards, and high-fidelity sales insights. 

Developing a modern web solution for inventory management requires balancing strict data validation with frictionless user interfaces. StockPilot bridges this gap by marrying **Next.js's App Router** architecture with **TanStack React Query** for state synchronization, and **Shadcn UI** for a clean, professional aesthetic.

Designed from the ground up to reflect a real-world enterprise application, the interface incorporates role-based layouts, robust JWT authentication handling (with automatic background token refresh), dynamic search parameters, and bulk operations.

---

## ✨ Key Features

- **🔐 Enterprise Authentication**: Fully-typed JWT authentication flow with registration, login, and silent token refreshing via Axios interceptors.
- **📊 Real-time Dashboard**: Summarized KPI indicators displaying total product count, overall valuation, low-stock alerts, and expiring batch warning metrics.
- **📦 Advanced Product Manager**: Full CRUD capabilities supporting SKU tracking, threshold warnings, and category organization.
- **📥 CSV Bulk Ingestion**: Import stock records in bulk via standard CSV structures.
- **🛒 Dynamic Point of Sale (POS) logger**: Input sales data on the fly with real-time stock availability checkups and instant financial calculation.
- **⏰ Smart Expiry Safeguard**: Dedicated dashboard filters separating "Expired Batches" and "Expiring Soon" products to eliminate stock wastage.
- **📈 Sales & Profit Reports**: Charts summarizing revenue trends, sales counts, and estimated profit metrics over custom date ranges.
- **🔔 Low-Stock & Expiry Alerts**: Interactive notification panel alerting staff about urgent replenishment needs or expiring inventory.
- **👥 Access Privileges Admin**: User profile and team settings panels to manage administrative roles dynamically.
- **💡 Recruiter Sandbox Mode**: Form auto-completion buttons on auth pages for rapid, single-click evaluation.

---

## 🖥️ Screens & Views

### 1. Dashboard (`/dashboard`)
An executive command center presenting 4 key business telemetry metrics (Total Products, Stock Valuation, Low Stock Items, Expiry Alerts) and high-level inventory distribution indicators.

### 2. Product Directory (`/products`)
A highly functional, searchable table tracking all warehouse merchandise. Admin-restricted item deletion and validation safeguards ensure the integrity of SKU definitions.

### 3. Categories Manager (`/categories`)
Enables categorizing products to refine navigation and grouping in reports. Features modal confirmation alerts for all destructive actions.

### 4. Stock Entry Log (`/stock-entries`)
Keeps audit logs of incoming products, recording quantity, buying price, and supplier data alongside custom CSV bulk-upload components.

### 5. Sales Console (`/sales`)
Allows operators to log outbound transactions, capturing the quantity, price, and sell-by date to automatically decrement stock levels.

### 6. Batch Expiry Tracker (`/expiry-tracking`)
Lists expired items (with single-click removal) and lists batches due to expire in the near future (customizable warning intervals).

### 7. Reports & Analytics (`/reports`)
Data visualization dashboard using dynamic, interactive graphs illustrating sales velocity, revenue generation, and product profitability logs over time.

### 8. Notifications Hub (`/notifications`)
A system event feed that categorizes messages by priority (e.g. `LOW_STOCK` warnings vs. generic updates) and allows marking logs as read.

### 9. Business Settings (`/settings`)
Includes active profile data, business metadata configuration, and the Team Management sub-panel for editing permissions.

---

## 📂 Folder Structure

The project implements a **modular structure** to maximize scalability and ensure clear Separation of Concerns. Feature-specific components and custom hooks are grouped under `modules/` rather than cluttering global folders.

```
StockPilot-Client/
├── app/                  # Next.js App Router Pages, layout wrappers & styles
│   ├── categories/       # Category page view
│   ├── dashboard/        # Dashboard layout & stats page
│   ├── expiry-tracking/  # Expiry alerts panel
│   ├── notifications/    # Actionable notification logs
│   ├── products/         # Products dashboard view
│   ├── reports/          # Graph-driven financial stats
│   ├── sales/            # Sales ingestion forms
│   ├── settings/         # Business settings and user logs
│   ├── stock-entries/    # Stock history & CSV upload wrapper
│   ├── globals.css       # Core styling & Tailwind imports
│   └── layout.tsx        # Shell wrapping Sidebar & Header components
├── components/           # Reusable UI component configurations
│   ├── ui/               # Primitive design tokens (Radix, Shadcn)
│   ├── layout/           # Shared Sidebar and Header layout
│   └── Providers.tsx     # Global providers wrapper (QueryClient, AuthContext)
├── hooks/                # Global React hooks
│   └── useAuth.tsx       # Authentication state machine
├── lib/                  # Platform configurations & utility wrappers
│   ├── api-client.ts     # Axios instance configuration with Interceptors
│   ├── auth-token.ts     # Storage manager for Access/Refresh tokens
│   └── utils.ts          # Shadcn design merging tool (tailwind-merge)
├── modules/              # Feature-encapsulated UI & business logic components
│   ├── auth/             # LoginForm, RegisterForm components
│   ├── products/         # ProductsManager component, forms and modals
│   ├── reports/          # Sales/Inventory reports graphics
│   ├── users/            # SettingsManager component
│   └── ...               # Sub-modules matching routing concerns
├── services/             # Axios API mapping endpoints to services
│   └── api.ts            # Type-safe Axios requests
└── types/                # Strict TypeScript interface declarations
    └── index.ts          # Complete business object structures
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- `npm` or `pnpm` (pnpm is configured in this repository)
- A running StockPilot backend REST API service (configured at port `5000` by default)

### 1. Clone the Repository
```bash
git clone https://github.com/rasel754/StockPilot-Client.git
cd StockPilot-Client
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Run Development Server
```bash
pnpm dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for Production
```bash
pnpm build
pnpm start
# or
npm run build
npm run start
```

---

## 🔑 Environment Variables

To direct the application to the correct REST API backend, create a `.env.local` file in the root directory:

```env
# Path to your backend api service
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🧱 Technical Architecture & Integration

### API Integration & Interceptors
Communications with the backend API are fully structured around a custom Axios client inside [api-client.ts](file:///d:/google-antigravity/StockPilot/StockPilot-Client/lib/api-client.ts). Key characteristics include:
- **Automatic Token Interceptor**: Injects the active JWT Bearer token into headers.
- **Silent Token Refreshing**: If a request encounters a `401 Unauthorized` response, the interceptor halts the request chain, invokes `/auth/refresh` using the stored Refresh Token, updates the credentials, and transparently replays the failed request.
- **Data Key Normalizer**: Automatically normalizes backend database identifiers (e.g. converting MongoDB `_id` to client-friendly `id` values) and resolves database relationships to prevent frontend parsing crashes.

### Role-Based Access Control
The application features two distinct roles:
1. **ADMIN**: Full system capabilities. Authorized to create or adjust items, delete categories and products, purge expired inventory, and edit the access privileges of other users inside the team settings panel.
2. **STAFF**: Read-and-write operational access. Restricted from deleting structural elements (products, categories) and adjusting team permissions.

UI elements that perform administrative actions are dynamically hidden or disabled for non-ADMIN users, with explanatory helper tooltip feedback (e.g., `"Administrative role required"`).

---

## 🌐 Deployment

The StockPilot client is optimized for serverless deployments on platforms such as **Vercel** or **Netlify**.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Add the `NEXT_PUBLIC_API_URL` environment variable during the configuration steps in the Vercel dashboard.

---

## 🔮 Future Roadmap

- [ ] **Offline Sync Capability**: Integrate IndexedDB storage with custom synchronization middleware to allow catalog updates offline.
- [ ] **Barcode Scanning Integration**: Support camera-based or hardware barcode scanners directly from the mobile-optimized interface.
- [ ] **Advanced Audit Trail**: Visual logs detailing which staff member modified specific item counts or checked out batches.
- [ ] **Multi-Warehouse Support**: Enable navigation and tracking across multiple physical warehouses or stores.

---

## 👔 For Recruiters

StockPilot Client is designed to showcase modern front-end engineering best practices. When evaluating this project, you will find:
- **Consistent Type Safety**: No generic `any` models; all services, API responses, form outputs, and component hooks conform to explicit TypeScript interfaces.
- **State Optimization**: TanStack Query is configured to cache data and automatically invalidate stale states following mutations.
- **Encapsulated Architecture**: Modular styling and compartmentalized code structures that ensure readability, simplicity, and ease of unit testing.
- **Production UX Details**: Refined validation messages via Zod, clean loading states, custom warning tooltips, and interactive confirmation modals.

**Evaluating quickly?** Use the custom **"Fill Dummy Data"** button on the Login and Registration screens to bypass setup and test the dashboard capabilities instantly!

---

*Crafted with 💙 by [Rasel](https://github.com/rasel754)*
