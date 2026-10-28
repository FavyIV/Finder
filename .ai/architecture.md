# Campus Lost & Found — Architecture

## Stack

| Layer                  | Technology                                            | Role                                                                                |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Frontend               | React                                                 | Renders UI: listing forms, search/filter views, admin/security dashboards           |
| Frontend build tooling | Vite (or CRA equivalent)                              | Bundles and serves the React app in development and production                      |
| Backend                | Node.js + Express                                     | REST API: auth, listing CRUD, search/filter, claim actions, moderation              |
| ORM                    | Prisma                                                | Schema definition, migrations, type-safe query layer over Postgres                  |
| Database               | PostgreSQL                                            | System of record for users, listings, locations, reports                            |
| Image storage          | Cloudinary                                            | Stores and serves found-item photos; handles resizing/thumbnails via URL transforms |
| Auth                   | JWT (issued by Express API)                           | Session tokens for authenticated requests; carries user id and role                 |
| Email verification     | School-domain check on sign-up (custom Express logic) | Restricts account creation to verified school email addresses                       |
| Hosting (API)          | TBD (e.g. Render/Railway)                             | Runs the Express server and connects to Postgres + Cloudinary                       |
| Hosting (frontend)     | TBD (e.g. Vercel/Netlify)                             | Serves the built React app                                                          |

## System Boundaries

The backend is organized by responsibility, not by data type, so each folder owns one concern end-to-end.

| Folder                          | Owns                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`                   | HTTP route definitions only — maps endpoints to controllers, no business logic                                                  |
| `src/controllers/`              | Request/response handling: validates input, calls services, shapes the HTTP response                                            |
| `src/services/`                 | Business logic: matching/filter logic, claim rules, expiry computation, moderation rules                                        |
| `prisma/` + `src/lib/prisma.ts` | Schema, migrations, and the single Prisma client — the only way the backend talks to Postgres, called only from `src/services/` |
| `src/middleware/`               | Auth verification (JWT decode), role-based access checks, request validation                                                    |
| `src/lib/cloudinary/`           | Upload/delete calls to Cloudinary — the only place that talks to the image store                                                |
| `src/lib/email/`                | School-domain verification logic                                                                                                |
| `frontend/src/pages/`           | Route-level views (report item, search, listing detail, admin queue)                                                            |
| `frontend/src/components/`      | Reusable UI pieces (listing card, filter bar, status badge)                                                                     |
| `frontend/src/api/`             | All fetch calls to the backend — the only place the frontend talks to the API                                                   |

**Rule:** no layer skips the one below it. Controllers never query Prisma directly; routes never contain business logic; the frontend never calls Cloudinary or Postgres directly — everything goes through the Express API.

## Storage Model

| Data                                                   | Where it lives                                         | Why                                                                                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users, roles, email                                    | PostgreSQL (`User` table)                              | Structured, relational, queried on every authenticated request                                                                                                      |
| Found/lost listings (category, location, date, status) | PostgreSQL (`FoundListing`, `LostListing` tables)      | Structured fields needed for filtering; relational links to users and locations                                                                                     |
| Predefined campus locations                            | PostgreSQL (`Location` table)                          | Referenced by foreign key from listings; not hardcoded so it can be seeded/edited without a code change                                                             |
| Reports/moderation records                             | PostgreSQL (`Report` table)                            | Needs relational links to listings and users, and a status enum                                                                                                     |
| Item photos                                            | Cloudinary                                             | Binary image data does not belong in Postgres; Cloudinary gives CDN delivery and transforms for free                                                                |
| Auth session state                                     | JWT (client-side, stored in memory or httpOnly cookie) | Stateless — no server-side session store needed for MVP                                                                                                             |
| Nothing is cached for MVP                              | —                                                      | No Redis or in-memory cache layer; traffic volume for a single campus does not justify the added complexity. Revisit only if search latency becomes a real problem. |

**Explicit rule:** the database never stores raw image bytes or Cloudinary credentials beyond the returned URL. The only image-related field in Postgres is `photoUrl` (a string).

## Auth and Access Model

- **Authentication:** Sign-up requires a `@futa.edu.ng` email address; the backend checks the domain against the constant `SCHOOL_EMAIL_DOMAIN = "@futa.edu.ng"` in `src/config/constants.ts` before creating the account. Login issues a JWT containing `userId` and `role`, which the frontend attaches to every API request as a bearer token.
- **Ownership:** A `FoundListing` is owned by its `reportedBy` user and a `LostListing` by its `postedBy` user. Ownership grants the right to edit that listing's fields (category, location, date/time, description, photo) to correct mistakes made at creation. Editing is restricted to listings still in `AVAILABLE` status — once a `FoundListing` is `CLAIMED` or `EXPIRED`, it is locked and no longer editable by its owner, since it now reflects a real-world outcome that shouldn't be altered after the fact.
- **Lost listing visibility:** Lost listings are visible to all authenticated users (not owner-only), so that any campus member can help trace a lost item back to its owner.
- **Editing under review:** When a `FoundListing` or `LostListing` in `AVAILABLE` status is edited by its owner while a `PENDING` report exists, the edit is allowed but the report remains `PENDING` — the admin must still review. Editing does not clear or dismiss the report.
- **Authorization (role-based):**
  - `USER` — can create found/lost listings, search/filter, view all found and lost listings, report listings.
  - `SECURITY` — everything a `USER` can do, plus marking a `FoundListing` as `CLAIMED`.
  - `ADMIN` — everything a `USER` can do, plus viewing the moderation queue and dismissing/removing reported listings.
- **Enforcement point:** role checks happen in `src/middleware/`, applied per-route (e.g. the claim endpoint requires `SECURITY` or `ADMIN`; the moderation endpoints require `ADMIN`). Controllers assume the middleware has already rejected unauthorized requests — they do not re-check roles themselves.

## Background Tasks

- **No scheduled/cron jobs in MVP.** A found item's "expired" state is computed at read time by comparing `createdAt` to a 30-day window in the service layer, not written to the database by a background process.
- **No AI/ML components in MVP.** There is no image-similarity matching or automated lost/found matching; matching is a live filtered query triggered by the user's search, executed synchronously within a request.
- If a real background job is introduced later (e.g. to flip listings to a stored `EXPIRED` status, or to send expiry-warning emails), it should live in its own `src/jobs/` folder and must not be called directly from controllers — only scheduled or manually triggered.

## Invariants

1. **The frontend never has direct network access to Postgres or Cloudinary.** All data access and image uploads go through the Express API. There is no code path where `frontend/src/` imports a database client or a Cloudinary SDK.
2. **No listing can exist without a valid `User` and `Location` foreign key.** A `FoundListing` cannot be created without a `reportedById` and `locationId` that reference existing rows — this is enforced at the database level (foreign key constraints), not only in application code.
3. **Only a `SECURITY` or `ADMIN` role can transition a `FoundListing` from `AVAILABLE` to `CLAIMED`.** No endpoint allows a `USER` role to set that status directly, regardless of whether they are the original reporter.
4. **A listing can only be edited by its owner while its status is `AVAILABLE`.** Once a `FoundListing` is `CLAIMED` or `EXPIRED`, no edit endpoint — including by the original reporter — may modify its fields; the record becomes read-only history.
5. **A listing's visibility is never fully hidden by a report.** A `PENDING` report attaches an "under review" badge but must never set the listing's status to something that removes it from search results — only an explicit admin action (`REMOVED`) does that.
6. **The app never stores or exposes a direct contact channel (phone, email, or messaging) between a finder and a loser.** No API response includes another user's contact information; the only cross-user interaction point is the claim verification performed in person by `SECURITY` staff.
7. **Every write to `FoundListing`, `LostListing`, or `Report` records the acting user's id.** No mutation is anonymous — `reportedById`, `postedById`, `claimedById`, and `reportedById`/`reviewedById` on `Report` are always populated from the authenticated session, never from client-supplied input.
