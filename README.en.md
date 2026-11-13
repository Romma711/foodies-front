# Foodies · Front

[Español](README.md) · **English**

Front end of **Foodies**, a restaurant booking and review platform for Mar del Plata, Argentina. Clients, restaurants and administrators use the same application, each in their own portal and with their own session.

Built with **Angular 22** without zone.js, **signals**, **Signal Forms** and **Tailwind CSS v4**, and tested with **442 tests** in Vitest. The UI is in Spanish.

[![CI](https://github.com/Romma711/foodies-front/actions/workflows/ci.yml/badge.svg)](https://github.com/Romma711/foodies-front/actions/workflows/ci.yml)

## What it does

| Role | What they can do |
|---|---|
| Visitor | Browse the catalog as a list or a map, filter by cuisine, see photos, menu and reviews |
| Client | Book a table, change or cancel the booking, write and edit reviews, manage their profile |
| Restaurant | Accept or cancel bookings, set special capacity for specific dates, upload photos and menu |
| Administrator | Approve restaurants, moderate reviews, apply strikes and see metrics in a separate dashboard |

The back end is a Spring Boot REST API: [Romma711/foodies](https://github.com/Romma711/foodies).

## Stack

| Area | Technology |
|---|---|
| Framework | Angular 22.2, standalone components, no zone.js |
| State | Signals (`signal`, `computed`, `linkedSignal`) in services |
| Forms | Signal Forms (`@angular/forms/signals`) |
| Styles | Tailwind CSS 4.3 with tokens in `@theme` |
| Maps and charts | Leaflet 1.9 and Chart.js 4.6 |
| Tests | Vitest 5 + jsdom, TestBed, `HttpTestingController`, axe-core |
| Quality | Prettier and GitHub Actions (format, tests and build on every push and PR) |

## Running it

You need **Node 24** and the back end running on `http://localhost:8080`.

```bash
npm ci
npm start
```

Open `http://localhost:4200`. The dev server forwards `/api` to the back end (see `proxy.conf.json`).

The admin dashboard is served on its own host: `http://dashboard.localhost:4200`.

For sample data, run the back-end seed (`node docs/db/seed-demo.mjs` in the `foodies` repo). Demo accounts and the full walkthrough are in [DEMO.md](DEMO.md) (Spanish).

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm test` | Tests in watch mode |
| `npm run test:ci` | The whole suite once, as CI runs it |
| `npm run format:check` | Checks formatting with Prettier |
| `npm run build` | Production build into `dist/` |

## Architecture

### Feature-based structure

```text
src/app/
├─ core/        session, interceptor, guards and host configuration
├─ features/    reservas, resenas, mapa, perfil, admin
├─ pages/       home, login, sign-up, catalog and restaurant panel
├─ shared/      a11y, charts, toast: code two or more features use
└─ components/  header and footer
```

Each feature keeps its components, services, models, utilities and tests together. A change to bookings lives in one folder, and the structure shows what the system is about before it shows the framework.

`shared/` only takes code that two modules already use. The toast and the chart factory started in reviews and moved when the admin dashboard needed them.

The oldest screens (catalog, login and restaurant panel) are still in `pages/`. Moving them into `features/` is the next structural improvement.

### State with signals

Each service keeps its state in private signals and exposes them read-only:

```ts
private readonly _resenas = signal<ResenaListDTO[]>([]);
readonly resenas = this._resenas.asReadonly();
readonly totalResenas = computed(() => this._resenas().length);
```

Derived values, such as the average rating or the star distribution, come from `computed` and are never stored twice. At this app's size the pattern covers what a global store would, with fewer moving parts.

Without zone.js, Angular re-renders only what depends on a signal that changed.

### Forms

Validation rules are written once as a Signal Forms schema and shared between forms. For example, `reglasReserva` validates both creating and changing a booking. The front end validates for instant feedback; the back end validates everything again.

### Role-based authentication

- Each role keeps its token under its own key (`foodies.token.CLIENTE`, `.RESTAURANTE`, `.ADMIN`), so sessions never overwrite each other.
- The service states which role each request travels with: `http.get(url, { context: withRole('CLIENTE') })`.
- The interceptor adds the token only when the request carries a role. On a 401 it logs out that session only.
- Guards are functional: `roleGuard(role)` redirects to that role's login and returns to the requested page.

### Two hosts, one build

On startup the app reads the hostname. If it starts with `dashboard.` it loads the admin routes; otherwise it loads the public ones. The dashboard lives on its own origin without the public header and footer, while the team keeps a single project and a single deploy.

### Routes

Every route is lazy loaded (`loadComponent` or `loadChildren`) and has its own `title`. The initial bundle has a budget: the build warns at 500 kB and fails at 1 MB.

## Styles

Tailwind CSS v4 reads the tokens in the `@theme` block of `src/styles.css` and generates the classes (`bg-brand-500`, `text-ink-900`). There is no config file: the tokens are CSS. Styles live in the template, next to the component.

## Accessibility

The target is WCAG 2.2 AA:

- visible focus on every control;
- `role="status"` and `role="alert"` regions announce sent bookings, saved changes and errors;
- focus is never lost when a form opens or closes (`enfocarTrasRender` helper);
- a skip link to the content, and Escape closes the mobile menu;
- contrast is measured for every color token.

axe-core reports no violations on the client pages, on desktop or mobile.

## Tests

| Kind | Files | What they check |
|---|---|---|
| Components (TestBed) | 64 | Rendering, interaction and the resulting DOM |
| Services (`HttpTestingController`) | 26 | URL, method, body and role of each request |
| Accessibility (axe-core) | 4 | WCAG violations inside the tests |

There are 442 tests in 70 files, and the whole suite runs in about 25 seconds. Test names are in Spanish and describe the rule they check. Dependencies jsdom cannot run, such as the Chart.js canvas, come in through an `InjectionToken` and are replaced by test doubles.

## Team

- Juan Estavillo
- Ramiro Sacchetta
- Andrés Roma

Final project for Programming, UTN FRMDP, 2026.
