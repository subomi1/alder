# Alder — project review

## Introduction

Alder is a product review system for a software engineering project. People discover objects, read ratings, and — once they have an account — leave a review. Administrators keep the catalog honest.

The running application is a TypeScript web app: React and Vite in the browser, an authorized API on the server, and PostgreSQL underneath. The course brief describes a split of Django REST Framework with SimpleJWT on Render and a React client on Vercel. Alder implements those responsibilities (presentation, secured API, relational data, role checks, validation, deployment) as one service so sessions stay on the same origin.

## Objectives

- Public discovery: landing page, search, category filters, product detail, averages, and reviews.
- Member accounts: registration, login, logout, profile, review history, create, edit, and delete.
- Administration: statistics, product management, user roles, suspension, and review moderation.
- Security that is enforced on the server, not only hidden in the interface.
- A test log and a deployment path.

## Features

Guests can read everything that is published. Members own one rating and one review per product. Editing updates the score and the text. Deleting removes both rows. A hidden review stays on the author's history and is excluded from the public average until an administrator publishes it again. The first real account is the administrator. That person cannot suspend themselves or resign if they are the last admin.

## Architecture

1. **Interface** — React, TypeScript, Tailwind, TanStack Router, TanStack Query, Lucide.
2. **API** — Zod-validated server functions for writes and personal reads. Public HTTP endpoints for health and catalog reads.
3. **Identity** — Email and password with a hashed secret, plus Google and X. The server resolves the session. The client never supplies a trusted user id.
4. **Database** — PostgreSQL. Migrations are the schema. Preview uses embedded Postgres; production uses the injected `DATABASE_URL`.

## Database

| Table | Role |
| --- | --- |
| user, session, account | Authentication (managed by the auth library) |
| categories | Shelf taxonomy |
| products | Object, price, copy, image, category |
| profiles | Display name, bio, role (`user` or `admin`), suspension |
| ratings | One score, 1–5, per user per product |
| reviews | Title, body, status, origin, author snapshot, foreign key to the rating |

Constraints: price range, score range, text lengths, unique `(product_id, user_id)` on both ratings and reviews, cascade deletes from product to ratings and reviews.

## Security

- Password hashing is handled by the auth library. Plaintext passwords are not stored or logged.
- Protected operations require a verified session (401 if missing).
- Admin operations require `profiles.role = admin` (403 otherwise). Suspended accounts cannot publish (403).
- Inputs are schema-checked (400). Duplicate reviews conflict (409). Missing products are 404.
- Queries use bound parameters. Sort order is chosen from a fixed map.
- Review bodies are rendered as React text, so stored HTML is not executed.
- Image paths must match `/products/<name>.jpg`.
- Mutations are not anonymous REST POSTs, which blocks cross-site form forgery. Authenticated calls also check same-site request metadata.
- No `.env` file is committed. Non-public configuration is injected at deploy time.

## Testing

Automated checks: `src/lib/catalog/validate.test.ts` (slugs, LIKE patterns, rating bounds, XSS-shaped titles accepted as text, SQL-shaped categories rejected, price parsing, password and email shape).

Manual cases — feature, scenario, expected result, actual result, status — are maintained on the in-app Project page (`/project`) across functional, security, API, usability, and responsive areas.

## Deployment

`npm run build` produces the production bundle and runs `npm run db:migrate`. Publishing the app provisions the database because migrations and sign-in are present. After publish, `GET /api/health` should return `{ "ok": true, "service": "alder" }`. Create one account; that account is the administrator.

Local preview: `npm run dev` on port 8080. No database URL is required.

## Challenges

- Guest browsing and per-user writes have to share one catalog without letting a caller pick someone else's id.
- Bootstrapping an administrator without shipping a default password.
- Keeping a moderated review hidden after the author edits the wording.
- Making search safe while still feeling immediate.

## Limitations

- No checkout. Prices are informational.
- No password-reset email.
- Product images are chosen from the catalog set, not uploaded.
- Categories are seeded rather than created in the admin desk.
- The object list is small on purpose. The review system is the product.

## Future improvements

Helpful votes, image uploads with content checks, email verification, an admin audit log, and pagination.
