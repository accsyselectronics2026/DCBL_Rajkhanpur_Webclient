# MRP Validation System – Web Client

Web client for the MRP Validation System at **Marico Ltd, Guwahati**. This project is a migration of the original PHP MVC application to **Next.js**, with the backend now living in Next.js route handlers that talk to MySQL directly.

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MySQL via `mysql2` (connection pool) |
| Auth | Signed session cookie (`jose`), `bcryptjs` for password hashes |
| Exports | `exceljs` (Excel), `jspdf` + `jspdf-autotable` (PDF) |
| Icons | `lucide-react` |

## Getting started

### Prerequisites
- Node.js 20 or later
- Access to the project's MySQL database

### Install
```bash
npm install
```

### Environment variables
Create a `.env.local` file in the project root (it is git-ignored, never commit it):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=<database user>
DB_PASSWORD=<database password>
DB_NAME=<database name>

# long random string, e.g. node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=<random string>

# set to true only when the site is served over HTTPS
COOKIE_SECURE=false

# when true, plain-text passwords are re-saved as bcrypt hashes on first login
# keep false while the old PHP app still uses the same database
UPGRADE_PASSWORDS=false
```

### Run
```bash
npm run dev      # development, http://localhost:3000
npm run build    # production build
npm run start    # run the production build
npm run lint     # lint
```

## Project structure

```
src/
  app/
    (auth)/login/            Login page
    (app)/                   Pages for signed-in users (shared sidebar layout)
      dashboard/
      bag-counter/
      current-transaction/
      reports/               Loader report
      master/
      admin/
    api/
      auth/login/            Login API
      reports/loader/        Loader report data
      health/db/             Database connection check
  components/
    layout/                  Sidebar, Topbar, menu config
    ui/                      Reusable UI (DataTable)
  lib/
    db.ts                    MySQL pool and query helpers
    auth/session.ts          Create and read the session cookie
    exportTable.ts           Excel and PDF export helpers
  types/
  proxy.ts                   Request gate: redirects signed-out users to /login
```

## How it works

- **Authentication:** `POST /api/auth/login` checks the user in `user_master`, then sets an HTTP-only session cookie (8 hours). `src/proxy.ts` checks that cookie on every request. Signed-out users are redirected to `/login`, and API calls get a `401`.
- **Database access:** all queries go through `src/lib/db.ts` with named placeholders (`:email`), so values are never concatenated into SQL.
- **Reusable table:** `src/components/ui/DataTable.tsx` provides search, sorting, rows per page, page selection, show/hide columns, and Excel/PDF export of exactly what is on screen. New list pages only pass columns and rows.
- **Dates:** the pool uses `dateStrings: true`, so MySQL date and time values stay as the exact stored text with no time-zone shift.

## Legacy API (kept for the external counter app)

The original PHP app exposes two endpoints used by an external application. Their URLs and JSON responses must stay unchanged:

- `/Api/GetSettingsProfile/{APP_ID}`
- `/Api/SaveNonPrintedBag`

These are intentionally public in `src/proxy.ts`, as they were in the PHP version. Adding a shared API key is recommended once the calling application can be updated.

## Next.js 16 notes

- The request gate file is `proxy.ts` (it replaces `middleware.ts`).
- `cacheComponents` is enabled, so:
  - do not use `export const runtime` in route files;
  - do not call `new Date()` while a component renders; read the date inside `useEffect` or an event handler.

## Migration status

| Module | Status |
|---|---|
| Database layer | Done |
| Login and session | Done |
| App shell (sidebar, top bar) | Done |
| Request gate (`proxy.ts`) | Done |
| Reports: filters, table, Excel, PDF | Done |
| Logout | Planned |
| Role-based page and button permissions | Planned |
| Reports: truck slip, images, video playback | Planned |
| Dashboard | Planned |
| Bag Counter and Current Transaction | Planned |
| Master data, Users, Roles | Planned |
| Camera configuration, Device status | Planned |
| Legacy `/Api` endpoints | Planned |

## Security notes

- Never commit `.env.local` or any file containing credentials.
- The original database stores some passwords in plain text. Enable `UPGRADE_PASSWORDS=true` only after the PHP app is retired, so users are moved to bcrypt hashes on login.
- Use a dedicated MySQL user with access to this database only, not `root`.
- Role permissions must be enforced in the API routes, not only by hiding menu items.
