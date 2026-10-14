# HR Assist

HR Assist is an internal web app for HR staff at Polish companies. It keeps the employee register, tracks each employee's daily attendance and leave, and generates the monthly timesheet (**Miesięczna ewidencja czasu pracy**) as an Excel file ready to print.

The UI and most validation messages are in Polish, and the domain follows Polish labour practice: PESEL and NIP numbers, absence codes such as `UW`, `UŻ`, `CH` and `NN`, 20 or 26 days of annual leave, part-time fractions of a full-time job (etat), and Polish public holidays.

The repository holds two independent applications:

| App                  | Path       | Description                                  |
| -------------------- | ---------- | -------------------------------------------- |
| **Backend** (API)    | `apps/api` | NestJS REST API on top of PostgreSQL         |
| **Frontend** (web)   | `apps/web` | Next.js dashboard used by HR staff           |

There is no root workspace. Each app has its own `package.json` and `pnpm-lock.yaml`, and you install and run each one separately with **pnpm**. npm is not used in this project.

---

## Table of contents

- [Features](#features)
- [Tech stack: Backend](#tech-stack-backend)
- [Tech stack: Frontend](#tech-stack-frontend)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Domain model](#domain-model)
- [Attendance statuses](#attendance-statuses)
- [Monthly timesheet report](#monthly-timesheet-report)
- [Architecture notes](#architecture-notes)
- [Testing](#testing)
- [Known limitations](#known-limitations)

---

## Features

### Authentication
- Users sign in with email and password. Passwords are hashed with **argon2id** plus a server-side pepper.
- After login the API sets the JWT in an **httpOnly `accessToken` cookie**. A `Bearer` header also works. The token is stored on the user record, so logging out invalidates it on the server.
- A Next.js `proxy.ts` (the Next 16 replacement for middleware) sends visitors without a cookie to `/login`, and sends logged-in users away from `/login` and `/`.

### Employees
- The employee list has a fuzzy, multi-term search (Fuse.js) that matches name, surname, position, location and status. The search query is kept in the URL (`?search=`).
- Each employee gets a status badge: **OK**, or **Do uzupełnienia** ("needs completing") when they have any unexcused absence (`NN`).
- A modal form adds and edits employees. It uses react-hook-form with Zod and checks values against the API while the user types:
  - PESEL: checksum and birth date are validated, and the API is asked whether the number is already taken.
  - Work schedule: start between 06:00 and 15:00, whole hours only. The end hour is calculated as start + working hours (1 to 8 h).
  - Employment date: between the app start date and 31 December of next year. Moving it later is blocked when the employee already has leave recorded before the new date.
  - Annual leave of 20 or 26 days. Lowering it is blocked when the employee has already used more days this year.
  - When adding an employee, the form remembers the last values used (location, position, hours, schedule, leave).
- The employee profile has a details tab (paginated cards with position, location, PESEL, schedule, fraction of full time, contract type, employment date, length of service and company) and a leave tab (progress bars for overdue and current leave).
- Employees can be **fired**, which is a soft delete that sets `firedAt`, and later **recovered**. Fired employees are read-only, but their past months can still be reported. Employees can also be deleted permanently.

### Attendance calendar
- The calendar shows one month per view, with one row per day: date, weekday, status badge, scheduled hours, nominal hours and actual hours, plus a totals footer.
- Weekends, public holidays and days outside the employment period are locked.
- A past or current workday with no record counts as **presence (`OB`)**. Presence is never stored; only absences are.
- Future days can be planned, for example as vacation. Unexcused absence cannot be planned. A future day with no plan shows as **"Pauza"**.
- Taking leave is blocked once the yearly limit (overdue + current) is used up.
- A bell icon lists the current year's unexcused absences (`NN`). Clicking an entry jumps to that day and highlights it. A **"Dziś"** (today) button does the same for the current day.
- Users can move between months only inside the employment period: from the employment month (never before the app start date) to the firing month, or to December of the current year + 5 if the employee has not been fired.

### Public holidays
- Polish public holidays come from the [Nager.Date](https://date.nager.at/) API (`nagerholidays.com`). The API syncs them **on startup** and **every day at 03:00** (cron), and translates the names to Polish.
- The **Dni wolne** page lists holidays with fuzzy search.

### Reports
- The **Raport** button on an employee profile generates the monthly timesheet as `.xlsx`. Only closed months can be selected, from the employment month up to last month, or up to the firing month for fired employees.
- The API also saves each generated file to disk under `apps/api/reports/{yyyy}/{mm}/`.

---

## Tech stack: Backend

`apps/api`, version 0.0.1

| Area                 | Technology                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| Runtime / language   | Node.js, **TypeScript 5**                                                   |
| Framework            | **NestJS 11** (`@nestjs/core`, `platform-express`)                          |
| Database             | **PostgreSQL** (`pg` driver)                                                |
| ORM                  | **TypeORM** (`@nestjs/typeorm`), Active Record style (`BaseEntity`)         |
| Validation           | `class-validator`, `class-transformer`, global `ValidationPipe`             |
| Auth                 | `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `cookie-parser`          |
| Password hashing     | `argon2` (argon2id with a pepper)                                           |
| Configuration        | `@nestjs/config`, `dotenv`                                                  |
| Scheduling           | `@nestjs/schedule` (daily holiday sync)                                     |
| API docs             | `@nestjs/swagger` (OpenAPI, Swagger UI at `/docs`)                          |
| Excel generation     | `exceljs`                                                                   |
| Utilities            | `date-fns` (with the `pl` locale), `lodash`, `fraction.js`, `ms`, `rxjs`    |
| Testing              | **Jest 30**, `ts-jest`, `supertest`, `@nestjs/testing`                      |
| Code quality         | ESLint 9 (flat config, `typescript-eslint`), Prettier                       |
| Package manager      | **pnpm**                                                                    |

## Tech stack: Frontend

`apps/web`, version 0.1.0

| Area                 | Technology                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| Framework            | **Next.js 16** (App Router, `typedRoutes`, `proxy.ts`)                      |
| UI library           | **React 19**                                                                |
| Language             | **TypeScript 5** (strict)                                                   |
| Styling              | **Tailwind CSS 4** (`@tailwindcss/postcss`), `tw-animate-css`               |
| Components           | **shadcn/ui** (style `base-nova`) built on **Base UI** (`@base-ui/react`), `cmdk`, `react-day-picker`, `class-variance-authority`, `cn` |
| Icons                | `lucide-react`                                                              |
| Fonts                | Geist and Geist Mono (`next/font`)                                          |
| Server state         | **TanStack Query 5** (`@tanstack/react-query`)                              |
| Client state         | **Zustand 5** (logged-in user, persisted to `localStorage`)                 |
| Forms and validation | **react-hook-form**, **Zod 4**, `@hookform/resolvers`, `validate-polish` (PESEL) |
| API types            | `openapi-typescript`, generated from the backend's Swagger JSON             |
| Search               | `fuse.js`, `use-debounce`                                                   |
| Notifications        | `sonner` (toasts)                                                           |
| Dates and maths      | `date-fns` (`pl` locale), `fraction.js`, `ms`                               |
| Component workshop   | **Storybook 10** (`@storybook/nextjs-vite`, a11y, docs, vitest and mcp addons) |
| Testing              | **Vitest** (browser mode with Playwright/Chromium) through `@storybook/addon-vitest` |
| Code quality         | ESLint 9 (`eslint-config-next`, `eslint-plugin-storybook`)                  |
| Package manager      | **pnpm** 10                                                                 |

---

## Repository structure

```
hr-assist/
├── apps/
│   ├── api/                              # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts                   # bootstrap: /api prefix, CORS, cookies, Swagger
│   │   │   ├── app.module.ts             # global pipe, interceptors, exception filter
│   │   │   ├── config/typeorm.config.ts
│   │   │   ├── db/data-source.ts         # TypeORM DataSource (Postgres, entities)
│   │   │   ├── common/
│   │   │   │   ├── filters/              # GlobalExceptionFilter → error envelope
│   │   │   │   ├── interceptors/         # ResponseWrapperInterceptor → success envelope
│   │   │   │   ├── hash/                 # HashService (argon2id + pepper)
│   │   │   │   ├── pipes/                # PESEL validation pipe
│   │   │   │   ├── validators/           # IsPesel, IsCompanyId, IsEmployeeExists,
│   │   │   │   │                         # IsNotBeforeAppStart, IsNotDuvetDay
│   │   │   │   └── utils/                # PESEL checksum and birth date check
│   │   │   └── modules/
│   │   │       ├── auth/                 # login / logout / me, JWT strategy and guard
│   │   │       ├── users/                # HR users (app accounts)
│   │   │       ├── companies/            # companies + addresses
│   │   │       ├── employees/            # employees, fire / recover, positions, PESEL check
│   │   │       ├── attendance/           # absences per day, status changes
│   │   │       ├── leaves/               # leave balance and limit checks
│   │   │       ├── holidays/             # Nager.Date sync (cron), holiday lookup
│   │   │       └── reports/              # monthly .xlsx timesheet (ReportEngine)
│   │   ├── test/                         # e2e tests
│   │   └── reports/                      # generated reports (gitignored)
│   │
│   └── web/                              # Next.js frontend
│       ├── .env.example
│       ├── .storybook/
│       └── src/
│           ├── proxy.ts                  # auth redirects based on the cookie
│           ├── app/
│           │   ├── login/                # login page
│           │   ├── (dashboard)/          # layout with sidebar
│           │   │   ├── employees/        # list + [id] profile
│           │   │   └── holidays/         # public holidays list
│           │   └── api/auth/logout/      # route handler that clears the cookie
│           ├── components/
│           │   ├── Employees/            # list, search, profile, calendar
│           │   ├── EmployeeModal/        # add / edit form (schema, inputs)
│           │   ├── ConfirmModal/
│           │   ├── Sidebar/
│           │   └── ui/                   # shadcn/ui components
│           ├── services/                 # apiRequest, ApiService, query keys
│           ├── store/                    # Zustand auth store
│           ├── hooks/                    # useHolidays
│           ├── lib/                      # constants (app start date), cn
│           ├── types/                    # generated OpenAPI types + aliases
│           └── utils/                    # calendar, month, day, form, report helpers
└── README.md
```

---

## Getting started

### Prerequisites

- **Node.js** (a current LTS version)
- **pnpm** 10 (`corepack enable` or `npm i -g pnpm`)
- **PostgreSQL** with an empty database for the app
- Internet access from the API, which fetches public holidays when it starts

### 1. Backend

```bash
cd apps/api
pnpm install
```

Create `apps/api/.env`. The backend has no `.env.example`; the full list of variables is in [Environment variables](#environment-variables).

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_URL=postgres://user:password@localhost:5432/hr_assist
WEB_URL=http://localhost:3000
JWT_SECRET=change-me
JWT_EXPIRES_IN=30d
HASH_PEPPER=change-me-too
APP_START_DATE=2026-01-01
```

Start the API in watch mode:

```bash
pnpm start:dev
```

- API: `http://localhost:3001/api`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs-json`

> **Database schema:** the project has no migrations. TypeORM `synchronize` is turned on only when `NODE_ENV=development`, and it creates or updates the tables automatically. With any other `NODE_ENV`, the schema must already exist.

### 2. Frontend

```bash
cd apps/web
pnpm install
cp .env.example .env
pnpm dev
```

The dashboard runs at `http://localhost:3000`. The web app runs on port 3000, so the API must use a different port (3001 in the examples).

### 3. First user

There is no seed script or sign-up page, and the `users` endpoints require a logged-in user. Create the first account directly in the `users` table. The `password` column must hold an **argon2id hash made with the same `HASH_PEPPER`** (passed as argon2's `secret` option), because that is what `HashService.hashText()` produces. After that, more users can be created through `POST /api/users`.

### 4. Companies

Every employee belongs to a company, and the web UI only lets you pick one. Create companies with `POST /api/companies` (Swagger UI works for this):

```json
{
  "name": "Example Sp. z o.o.",
  "nip": "1234567890",
  "address": { "street": "Prosta", "houseNumber": 1, "postCode": "00-001", "city": "Warszawa" }
}
```

---

## Environment variables

### Backend: `apps/api/.env`

| Variable         | Required | Default      | Description                                                                 |
| ---------------- | :------: | ------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`   | yes      | none         | PostgreSQL connection string                                                |
| `JWT_SECRET`     | yes      | none         | Secret used to sign JWTs                                                    |
| `HASH_PEPPER`    | yes      | none         | Pepper (argon2 `secret`) for password hashing. Changing it breaks every stored password. |
| `WEB_URL`        | yes      | none         | Frontend origin allowed by CORS (with credentials)                          |
| `PORT`           | no       | `3000`       | HTTP port. Set it to `3001` so it doesn't clash with Next.js.               |
| `JWT_EXPIRES_IN` | no       | `15m`        | JWT lifetime (an `ms` string such as `15m` or `30d`)                        |
| `APP_START_DATE` | no       | `2026-01-01` | Earliest date the system keeps records for (`YYYY-MM-DD`)                   |
| `NODE_ENV`       | no       | none         | `development` turns on schema `synchronize`. Any value other than `production` turns on SQL logging. `production` makes the auth cookie `secure`. |

### Frontend: `apps/web/.env` (template: [`apps/web/.env.example`](apps/web/.env.example))

| Variable                     | Example                 | Description                                                                                 |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`        | `http://localhost:3001` | Base URL of the backend API                                                                 |
| `NEXT_PUBLIC_APP_START_DATE` | `2026-01-01`            | Earliest date the app keeps records for. **Must match `APP_START_DATE` in the API.** It is inlined at build time, so restart `next dev` after changing it. |

---

## Scripts

### Backend (`apps/api`)

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm start:dev`   | Start in watch mode                      |
| `pnpm start:debug` | Start in debug and watch mode            |
| `pnpm build`       | Compile to `dist/`                       |
| `pnpm start:prod`  | Run the compiled build (`node dist/main`)|
| `pnpm test`        | Unit tests (Jest)                        |
| `pnpm test:watch`  | Unit tests in watch mode                 |
| `pnpm test:cov`    | Unit tests with coverage                 |
| `pnpm test:e2e`    | End-to-end tests                         |
| `pnpm lint`        | ESLint with `--fix`                      |
| `pnpm format`      | Prettier                                 |

### Frontend (`apps/web`)

| Command                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`             | Next.js dev server                                                      |
| `pnpm build`           | Production build                                                        |
| `pnpm start`           | Serve the production build                                             |
| `pnpm lint`            | ESLint                                                                  |
| `pnpm generate:types`  | Regenerate `src/types/api.types.ts` from `http://localhost:3001/docs-json` (the API must be running) |
| `pnpm storybook`       | Storybook on port 6006                                                  |
| `pnpm build-storybook` | Static Storybook build                                                  |

---

## API overview

All routes start with **`/api`**. Swagger UI at `/docs` has the full, live documentation.

| Method | Path                                                              | Description                                           |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------- |
| POST   | `/auth/login`                                                     | Log in and set the `accessToken` cookie               |
| POST   | `/auth/logout`                                                    | Log out and clear the cookie and stored token         |
| GET    | `/auth/me`                                                        | Current user                                          |
| GET/POST | `/users`                                                        | List / create app users                               |
| GET/PUT/DELETE | `/users/:id`                                              | Get / update / delete a user                          |
| GET/POST | `/companies`                                                    | List / create companies                               |
| GET/PUT/DELETE | `/companies/:id`                                          | Get / update / delete a company                       |
| GET    | `/employees`                                                      | All employees, including fired ones, each with an `ok` flag |
| POST   | `/employees`                                                      | Create an employee                                    |
| DELETE | `/employees`                                                      | Delete **all** employees                              |
| GET    | `/employees/positions`                                            | Distinct positions (used for autocomplete)            |
| GET    | `/employees/pesel/check-availability?pesel=`                      | Whether a PESEL is still free                         |
| GET/PUT/DELETE | `/employees/:id`                                          | Get / update / delete an employee                     |
| POST   | `/employees/:id/fire`                                             | Fire an employee (soft delete)                        |
| POST   | `/employees/:id/recover`                                          | Recover a fired employee                              |
| GET    | `/employees/:employeeId/attendance/absences?year=&month=`         | Absences in a month or a year                         |
| GET    | `/employees/:employeeId/attendance/absences/count-after?date=`    | Number of absences after a date                       |
| PUT    | `/employees/:employeeId/attendance`                               | Set a day's status (`{ date, status }`). `OB` removes the absence. |
| GET    | `/employees/:employeeId/leaves`                                   | Leave balance for the current year (overdue and current, base and used) |
| GET    | `/employees/:employeeId/leaves/can-be-set?leave=20\|26`           | Whether the yearly leave can be changed to this value |
| GET    | `/employees/:employeeId/leaves/has-leaves-before-given-date?date=`| Whether there is leave before a date                  |
| GET    | `/holidays/:year?`                                                | Public holidays (defaults to the current year)        |
| GET    | `/reports/:employeeId/:year/:month`                               | Monthly timesheet download (`.xlsx`)                  |

### Response envelope

Every JSON response is wrapped by a global interceptor (on success) or a global exception filter (on error):

```jsonc
// success
{ "ok": true,  "data": { /* ... */ }, "statusCode": 200, "errors": null }
// error
{ "ok": false, "data": null, "statusCode": 422, "errors": ["Employee is fired"] }
```

`204 No Content` responses are sent as `200` with `data: null`. The report endpoint is the one exception: it streams the raw file with `Content-Disposition`, which is listed in CORS `exposedHeaders` so the browser can read the file name.

---

## Domain model

```
User ──(app account, separate from employees)

Company 1 ── 1 Address
   │
   └── 1..* Employee ── 0..* Absence (one per employee per date)
                │
                ├── workSchedule { start, end }       (embedded)
                └── leave { base, overdue, current }  (embedded)

Holiday (date, Polish name), synced from Nager.Date
```

| Entity       | Notable fields                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `users`      | `name`, `surname`, `pesel` (unique), `email` (unique), `password` (hash, never serialized), `accessToken`       |
| `companies`  | `name`, `nip` (unique, 10 digits), `address` (eager, cascades)                                                  |
| `addresses`  | `street`, `houseNumber`, `postCode` (`XX-XXX`), `city`                                                          |
| `employees`  | `pesel` (unique), `position`, `location` (1 = production hall *Hala*, 2 = office *Biuro*), `workHours` (1–8), `workSchedule`, `employmentDate`, `contractType` (1 = employment contract *Umowa o pracę*), `leave`, `firedAt` (soft-delete column) |
| `absences`   | `date`, `type` (an absence code), unique on (`employee`, `date`)                                               |
| `holidays`   | `date`, `name`                                                                                                  |

---

## Attendance statuses

The frontend copies the status enum from the backend (`attendance.types.ts`). If you change it, change both places.

| Code  | Meaning (PL)                              | Meaning (EN)                    | Counts as leave |
| ----- | ----------------------------------------- | ------------------------------- | :-------------: |
| `OB`  | Obecność                                  | Presence (never stored)         |                 |
| `NN`  | Nieobecność nieusprawiedliwiona           | Unexcused absence               |                 |
| `UW`  | Urlop wypoczynkowy                        | Vacation leave                  | ✔               |
| `UŻ`  | Urlop na żądanie                          | On-demand leave                 | ✔               |
| `CH`  | Zwolnienie lekarskie                      | Sick leave                      |                 |
| `OP`  | Opieka                                    | Care leave                      |                 |
| `UB`  | Urlop bezpłatny                           | Unpaid leave                    |                 |
| `UM`  | Urlop macierzyński                        | Maternity leave                 |                 |
| `UO`  | Urlop ojcowski                            | Paternity leave                 |                 |
| `UR`  | Urlop rodzicielski                        | Parental leave                  |                 |
| `WYC` | Urlop wychowawczy                         | Childcare leave                 |                 |
| `NUP` | Nieobecność usprawiedliwiona płatna       | Paid excused absence            |                 |
| `NUN` | Nieobecność usprawiedliwiona niepłatna    | Unpaid excused absence          |                 |
| `REH` | Świadczenie rehabilitacyjne               | Rehabilitation benefit          |                 |
| `UOK` | Urlop okolicznościowy                     | Special-occasion leave          |                 |
| `WZS` | Dzień wolny za święto                     | Day off in lieu of a holiday    |                 |

Only `UW` and `UŻ` count toward the yearly leave limit. Overdue leave from previous years is used up first, then current-year leave.

---

## Monthly timesheet report

`ReportsService` collects the employee, company, absences and holidays for the month. `toMonthlyTimesheetData` (a pure, unit-tested mapper) turns them into one row per day, and `ReportEngine` renders the rows with ExcelJS:

- A header with the title, month and year, a "generated at" timestamp, an employee box (name, PESEL, contract with fraction of full time, position with location) and a company box (name, address, NIP).
- A 22-column table: date, weekday (plus the holiday name), scheduled hours, nominal and actual hours, overtime columns (not tracked yet, always 0), and one column per absence group (vacation, on-demand, maternity, parental, unpaid, sick, care, paid and unpaid excused, unexcused, military service).
- A **RAZEM** (totals) row that uses real `SUM` formulas.
- Weekends and holidays are greyed out, leave columns are colour-coded, and zeros show as `-`.
- The sheet is set to print on a single landscape A4 page.
- The file name is `{pesel}-{name}-{surname}-{MM}-{YYYY}.xlsx`, with Polish diacritics removed.

The rules for each day match the web calendar. A day before employment or after firing is empty. A holiday or weekend is a day off. Any other day is a workday: present means full hours, and an absence means 0 actual hours with the full day booked in that absence's column.

---

## Architecture notes

- **Global request pipeline (API):** a `ValidationPipe` (whitelist, forbid unknown properties, transform with implicit conversion), `ClassSerializerInterceptor` (hides `password` and `accessToken`), `ResponseWrapperInterceptor` and `GlobalExceptionFilter`.
- **Validators with database access:** class-validator constraints such as `IsCompanyId`, `IsEmployeeExists` and `IsNotDuvetDay` are injectable Nest providers. This works because of `useContainer(app.select(AppModule))`.
- **Circular module dependencies** (Employees, Attendance, Leaves and Reports) are resolved with `forwardRef`.
- **Dates:** date-only values are compared as `YYYY-MM-DD` strings in UTC, while the moment of firing (`firedAt`) is compared in local time. This keeps day calculations independent of the server's time zone.
- **Typed API client (web):** `src/types/api.types.ts` is generated from the backend's OpenAPI spec, and `api-aliasses.types.ts` gives the common shapes short names. All calls go through `apiRequest`, which sends cookies (`credentials: "include"`), unwraps the response envelope and turns errors into `Error`s with the API's messages.
- **Caching (web):** TanStack Query keys are centralised in `QueryKeysService`. After an attendance change, `refreshAttendanceCaches` refreshes the month, the year's absences, leave and employee data together.
- **Debug logs:** the web app logs auth and calendar events to the console outside production (`utils/debug.utils.ts`).

---

## Testing

**Backend:** run `pnpm test` in `apps/api`. The unit tests cover:
- `HashService` (hashing and verification with a pepper)
- `timesheet-report.mapper`: days in the month, workdays, every absence type, weekends, holidays with labels, and the employment and firing boundaries
- smoke tests for the exception filter, response interceptor and PESEL pipe

`pnpm test:e2e` runs the default Nest e2e test, which needs a configured database.

**Frontend:** Storybook stories (for example `Modals/EmployeeModal`) also run as Vitest browser tests in headless Chromium through `@storybook/addon-vitest`.

---

## Known limitations

- The project has no migrations or seed data. The schema relies on `synchronize` in development, and the first user has to be inserted by hand.
- The `attendance`, `leaves` and `reports` controllers have no `@Auth()` guard, unlike the other modules.
- `JWT_EXPIRES_IN` defaults to `15m`, but the cookie lives for 30 days. With the default, the cookie outlives the token and requests return `401`. Set a longer `JWT_EXPIRES_IN` if you want sessions to last longer.
- Overtime is not tracked yet; the report columns for it are always 0.
- Only one contract type (employment contract) is supported.
- Generated reports pile up in `apps/api/reports/` and are never cleaned up.
