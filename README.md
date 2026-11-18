# Alder

Alder is a product review house. Guests browse a shelf of objects, members write star ratings and reviews, and administrators moderate the catalog, the membership, and the notes.

## Stack

- React, TypeScript, Vite, Tailwind CSS
- TanStack Router and TanStack Query
- PostgreSQL
- Server-verified sessions (email and password with hashed passwords, plus Google and X)
- Lucide icons

The course brief also names Django, Django REST Framework, SimpleJWT, Vercel, and Render. Alder keeps the same boundaries — interface, authorized API, relational database — in one deployable service. Schema lives in `migrations/`. API rules live in `src/lib/catalog/`. Pages live in `src/routes/`.

## Run

```bash
npm install
npm run dev
```

The dev server listens on port 8080. If `DATABASE_URL` is unset, the app uses embedded Postgres and applies `migrations/` on startup. Do not create a `.env` file for secrets. Production injects `DATABASE_URL` and auth credentials.

Authentication is enabled by omitting `VITE_AUTH_ENABLED` from `.grok/app-env.json`. Email and password is switched on in `src/lib/auth/email-password.ts`.

The first account to sign up becomes the administrator.

## Scripts

```bash
npm run typecheck
npm test
npm run build
```

Unit tests for validation live in `src/lib/catalog/validate.test.ts`. The full test log — functional, security, API, usability, responsive — is on the in-app Project page and in `docs/PROJECT_REVIEW.md`.

## HTTP API

Public reads:

- `GET /api/health` → `200 { ok, service }`
- `GET /api/catalog?q=&category=&sort=` → `200 { data }` or `400`
- `GET /api/catalog/:slug` → `200 { data }` or `404`

Sort is one of `rating`, `newest`, `price_asc`, `price_desc`, `name`. Mutations are server functions, not open POSTs. They return `400`, `401`, `403`, `404`, or `409` when the input or the role is wrong.

## Deploy

1. Publish the app. The production build runs migrations.
2. The host provisions Postgres because the app ships migrations and sign-in.
3. Confirm `GET /api/health` after publish.
4. Create the first account. That person is the administrator.

Never commit database URLs, session secrets, or OAuth secrets. Browser-visible variables must not carry them.

## Security notes

- Passwords are hashed. The application code does not store them.
- Every member or admin query uses the server session, never a user id from the client.
- SQL values are parameters. Order-by columns are an allow-list.
- Review text is rendered as text, not HTML.
- Admin actions check the profile role after authentication.

See `docs/PROJECT_REVIEW.md` for objectives, architecture, challenges, limitations, and future work.
