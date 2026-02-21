# FlowStack VC Discovery

AI-assisted deal flow tracking app for thesis-driven investors.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- Backend: Express + Vite middleware (dev), Better-SQLite3
- Auth: JWT in HTTP-only cookies + bcryptjs
- Enrichment: Groq API + Cheerio scraping

## Environment Variables

Create a `.env` file in the project root.

| Variable | Required | Used in | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | Yes (for enrichment) | `POST /api/enrich` | Required for AI enrichment calls. |
| `JWT_SECRET` | Yes (recommended) | Auth token sign/verify | If missing, server falls back to an insecure default. Set a strong value in all environments. |
| `APP_URL` | No | Not currently used in runtime code | Kept from template; safe to omit for local dev. |
| `NODE_ENV` | No | Server mode switch | `production` enables static serving from `dist`. |

Example:

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=replace_with_a_long_random_secret
APP_URL=http://localhost:3000
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
- `npm start`: Runs production server (`node server.ts`).
- `npm run clean`: Removes `dist` (uses `rm -rf`, Unix-style).

## Features

### Authentication
- Register/login/logout.
- Profile fetch (`/api/auth/me`) and profile update (`/api/auth/profile`).
- Password hashing with bcrypt.
- JWT cookie-based session management.

### Dashboard
- KPI cards (thesis matches, pipeline volume, estimated deal flow, sectors).
- Live intelligence feed UI.
- Saved search quick preview.
- Pipeline stage summary.

### Companies
- Company list with search.
- Advanced filters: industry, stage, employee ranges, enriched-only.
- Multi-select actions + CSV export.
- Save current search filters.
- Favorite/unfavorite companies.
- Per-company enrichment trigger.

### Company Profile
- Detailed company view.
- AI enrichment panel with summary/signals.
- Notes editing.
- Save-to-list menu.
- Share/copy-link and additional actions menu.
- Timeline UI.

### Lists
- Create/delete lists.
- Add/remove companies in lists.
- Export list to JSON.

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
  - Output: summary, `what_they_do`, keywords, derived signals, source, timestamp

## Data Storage

- SQLite (`database.sqlite`):
  - `users` table (id, name, email, password, company, location, created_at)
- LocalStorage:
  - companies, lists, saved searches, activities
  - user favorites, user notes, thesis

## Notes

- Landing page hero image is loaded from `public/landing-dashboard.png`.
- If auth cookies are blocked in your browser/environment, review secure cookie behavior (`secure: true`, `sameSite: "none"` in `server.ts`).

## License

MIT
