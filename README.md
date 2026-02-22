# FlowStack VC Discovery

AI-assisted deal flow tracking app for thesis-driven investors.

## Project Structure

- `frontend/`: React app (`src`, `public`, `index.html`, `vite.config.ts`)
- `backend/`: Express app (`server.ts`, `src/server/*`)
- `dist/`: Production frontend bundle consumed by backend in production mode

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- Backend: Express + Vite middleware (dev), MongoDB Node Driver
- Auth: JWT in HTTP-only cookies + bcryptjs
- Enrichment: Groq API + Cheerio scraping

## Environment Variables

Create a `.env` file in the project root.

| Variable | Required | Used in | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | Yes (for enrichment) | `POST /api/enrich` | Required for AI enrichment calls. |
| `JWT_SECRET` | Yes (recommended) | Auth token sign/verify | If missing, server falls back to an insecure default. Set a strong value in all environments. |
| `MONGODB_URI` | Yes | Backend DB connection | MongoDB connection string used for users/auth data. |
| `MONGODB_DB_NAME` | No | Backend DB selection | Defaults to `harmonicvc` if omitted. |
| `APP_URL` | No | Not currently used in runtime code | Kept from template; safe to omit for local dev. |
| `NODE_ENV` | No | Server mode switch | `production` enables static serving from `dist`. |
| `VITE_API_URL` | Frontend deploys | Frontend API base | Set on Vercel to backend domain (Render/Railway/etc.). |
| `CORS_ORIGIN` | Backend deploys | CORS allowlist | Comma-separated origins allowed to call backend API. |
| `CORS_ALLOW_VERCEL` | Optional | Backend CORS | `true` allows `https://*.vercel.app` origins. |
| `COOKIE_SECURE` | Backend deploys | Auth cookies | Use `true` in production HTTPS. |
| `COOKIE_SAMESITE` | Backend deploys | Auth cookies | Use `none` for cross-site frontend/backend cookies. |

Example:

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=replace_with_a_long_random_secret
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/harmonicvc?retryWrites=true&w=majority
MONGODB_DB_NAME=harmonicvc
APP_URL=http://localhost:3000
VITE_API_URL=
CORS_ORIGIN=
CORS_ALLOW_VERCEL=false
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add env file:
```bash
copy .env.example .env
```
Then update `.env` and add `JWT_SECRET`.

3. Run in development:
```bash
npm run dev
```
App runs at `http://localhost:3000`.

Note: local dev now requires `MONGODB_URI` to be set.

4. Type-check:
```bash
npm run lint
```

5. Production build + run:
```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev`: Starts Express server with Vite middleware.
- `npm run build`: TypeScript build + Vite production bundle.
- `npm run lint`: TypeScript no-emit check.
- `npm run preview`: Preview Vite build (frontend only).
- `npm start`: Runs production server (`NODE_ENV=production` via `tsx`).
- `npm run clean`: Removes `dist` with cross-platform Node script.

## Deployment

### Node Version
- Recommended: Node.js `24.x` (LTS)
- Also supported: Node.js `22.x`

### Render (Backend)
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Required env vars:
  - `NODE_ENV=production`
  - `MONGODB_URI=...`
  - `MONGODB_DB_NAME=harmonicvc`
  - `JWT_SECRET=...`
  - `GROQ_API_KEY=...`
  - `CORS_ORIGIN=https://your-app.vercel.app` (origin only, no path like `/landing`)
  - `CORS_ALLOW_VERCEL=true`
  - `COOKIE_SECURE=true`
  - `COOKIE_SAMESITE=none`

### Vercel (Frontend)
- Build command: `npm run build`
- Output directory: `dist`
- Required env vars:
  - `VITE_API_URL=https://your-backend.onrender.com`

## Features

### Authentication
- Register/login/logout.
- Profile fetch (`/api/auth/me`) and profile update (`/api/auth/profile`).
- Password hashing with bcrypt.
- JWT cookie-based session management.

### Dashboard
- KPI cards (thesis matches, pipeline volume, estimated deal flow, sectors).
- Live intelligence feed from internet signals + local enrichment/activity fallback.
- Saved search quick preview.
- Pipeline stage summary.

### Companies
- Sortable + paginated companies table.
- Global search + advanced filters.
- Advanced filters: industry, stage, employee ranges, enriched-only.
- Multi-select actions + CSV export.
- Save current search filters.
- Favorite/unfavorite companies.
- Per-company enrichment trigger.

### Company Profile
- Detailed company view.
- AI enrichment panel with:
  - Summary (1-2 sentences)
  - What they do (3-6 bullets)
  - Keywords (5-10)
  - Derived signals (2-4 inferred signals)
  - Sources (exact URLs scraped + timestamp)
- Notes editing.
- Save-to-list menu.
- Share/copy-link, follow, export brief, and additional actions menu.
- Timeline UI.

### Lists
- Create/delete lists.
- Add/remove companies in lists.
- Export list to JSON and CSV.

### Saved Searches
- Save named filter sets.
- Re-run saved searches.
- Delete saved searches.

### Settings
- Theme mode: light/dark/system.
- Investment thesis configuration (sectors/keywords).
- Clear activity history.

### Profile & UX
- User profile and recent activity feed.
- Global command palette (`Ctrl/Cmd + K`).
- Notification center (mock data UI).
- Responsive sidebar layout.

### Scout Assistant
- Thesis-aware chatbot for sourcing, ranking, and diligence support.
- Select context companies (up to 10) for grounded analysis.
- Suggested prompts and free-form chat input.
- Route: `/scout` (requires login).

## Product Reference Benchmarks

Use these products as inspiration for UX patterns and data workflows:

- Harmonic (`harmonic.ai`): end-to-end discovery workflow and signal-centric operating views.
- Cardinal (`trycardinal.ai`): thesis-oriented scouting and conviction framing.
- PitchBook / Crunchbase / CB Insights: market map patterns, company profile depth, and comparable research flows.
- Affinity: relationship intelligence and team collaboration workflow patterns.
- Dealroom / Tracxn / SourceScrub: discovery funneling, filtering, and list-building workflows.

These are reference points only; FlowStack should keep its own thesis-first workflow and information architecture.

## Core Functions (Frontend State/API)

### `AuthContext` functions
- `login(credentials)`
- `register(credentials)`
- `logout()`
- `updateProfile(data)`
- `checkAuth()` on app boot

### `AppContext` functions
- `addList(name)`, `deleteList(id)`
- `addCompanyToList(listId, companyId)`, `removeCompanyFromList(listId, companyId)`
- `saveSearch(name, filters)`, `deleteSearch(id)`
- `addCompany(company)`, `updateCompany(company)`
- `toggleFavorite(id)`
- `enrichCompany(id)` -> calls backend `/api/enrich`
- `addActivity(action, details)`, `clearActivities()`
- `updateThesis(thesis)`

## Backend API

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` (auth required)
- `PUT /api/auth/profile` (auth required)

### Enrichment
- `POST /api/enrich` (auth required)
  - Input: `{ "url": "https://company.com" }`
  - Output: summary, `what_they_do`, keywords, derived signals, sources, timestamp

### Live Feed
- `GET /api/live-feed` (auth required)
  - Query: `companies` (comma-separated names), optional `limit`, `perCompany`
  - Output: live internet feed items from public Google News RSS sources

### Scout Chat
- `POST /api/chat` (auth required)
  - Input: `{ "message": "...", "thesis": {...}, "companies": [...] }`
  - Output: `{ "reply": "...", "timestamp": "ISO string" }`

### Chatbot Usage
1. Open Scout Assistant from the sidebar (`/scout`).
2. Select context companies.
3. Ask a prompt or use a suggested question.
4. Use the response to prioritize outreach, rank targets, or draft diligence steps.

## Data Storage

- MongoDB:
  - `users` collection (id, name, email, password, company, location, createdAt)
- LocalStorage:
  - companies, lists, saved searches, activities
  - user favorites, user notes, thesis

## Notes

- Landing page hero preview switches by theme:
  - Light: `frontend/public/landing-dashboard-light.png`
  - Dark: `frontend/public/landing-dashboard-dark.png`
- For split frontend/backend deploys (Vercel + Render), set:
  - `VITE_API_URL` on frontend
  - `CORS_ORIGIN` / `CORS_ALLOW_VERCEL` and cookie vars on backend.

## License

MIT
