# Campus Lost & Found — Code Standards

These rules apply to every file in the repo. They are written to match `architecture.md` (layer boundaries, invariants) and `schema.prisma` (data model). If a rule here conflicts with `architecture.md`, `architecture.md` wins.

## TypeScript Conventions

- **Strict mode is on** in both `tsconfig.json` files (`"strict": true`). No file may disable it.
- **No `any`.** Use `unknown` and narrow it. The only permitted escape hatch is `// @ts-expect-error` with a one-line reason.
- **Prefer `type` for shapes and unions; use `interface` only when extending.** Example: `type ListingFilters = { category?: Category; locationId?: string }`.
- **Use Prisma's generated types and enums** (`Role`, `Category`, `FoundStatus`, `ReportStatus`) instead of redefining them. Never write a string-literal union that duplicates a Prisma enum.
- **Explicit return types on every exported function.** Inferred return types are fine for local helpers.
- **Naming:**
  - Variables, functions: `camelCase`
  - Types, React components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE` (e.g. `LISTING_EXPIRY_DAYS = 30`)
  - Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components
- **No magic numbers or strings.** The 30-day expiry, JWT lifetime, upload size limit, allowed image types, and school email domain each live in one named constant in `src/config/constants.ts`. Specifically: `LISTING_EXPIRY_DAYS = 30`, `MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024` (10 MB, per Cloudinary free tier), `ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png"]`, `SCHOOL_EMAIL_DOMAIN = "@futa.edu.ng"`.
- **Dates are `Date` objects in code and ISO 8601 strings over the wire.** Never pass formatted date strings between layers.
- **Validate all external input with Zod** (request bodies, query params, env vars). Derive TypeScript types from the schema with `z.infer` rather than writing them twice.
- **Use `async/await`**, never raw `.then()` chains. Every `await` that can fail is either inside a controller wrapped by the shared error handler or inside a `try/catch` that handles the failure deliberately.

## Framework Patterns

### Express (backend)

- **Layers call downward only:** `routes → controllers → services → Prisma`. A route file contains no logic; a controller contains no Prisma calls; a service never touches `req` or `res`.
- **Controllers** do three things: parse/validate input (Zod), call one service function, shape the HTTP response. Nothing else.
- **Services** hold all business rules: expiry computation, edit-only-while-`AVAILABLE`, claim transitions, report handling. Services take plain typed arguments and return plain typed values or throw an `AppError`.
- **Errors:** services throw `AppError(code, message, httpStatus)`. A single error-handling middleware in `src/middleware/error-handler.ts` converts them to the response envelope. Controllers do not send error responses themselves.
- **Auth and roles are middleware, not controller code.** Use `requireAuth` on every non-public route and `requireRole(Role.SECURITY, Role.ADMIN)` where needed. Controllers read the user from `req.user` and trust it.
- **The acting user's id always comes from `req.user.id`**, never from the request body (architecture invariant #7).
- **One Prisma client**, exported from `src/lib/prisma.ts`. Never call `new PrismaClient()` anywhere else.
- **Expiry is applied in one place:** a `notExpiredWhere()` helper in `src/services/listing-expiry.ts` returns the Prisma `where` fragment (`createdAt` within the last `LISTING_EXPIRY_DAYS`). Every query that returns found listings uses it; no service re-implements the date math.

### React (frontend)

- **Function components and hooks only.** No class components.
- **Pages fetch, components render.** Components in `components/` receive data through props and contain no fetch calls. Pages in `pages/` (or custom hooks they call) own data loading.
- **All network calls live in `frontend/src/api/`.** Components never call `fetch` directly (architecture invariant #1). Each API function has typed arguments and a typed return value.
- **Server state uses TanStack Query** (`useQuery` / `useMutation`). Do not mirror server data into `useState` or a global store. `useState` is for local UI state only (open/closed, form input).
- **Forms use React Hook Form with the same Zod schemas' shape** as the backend rules (category required, location required, description length limit), so the client and server reject the same inputs.
- **Every data-driven view handles three states explicitly:** loading, error, and empty. No view renders blank on failure.
- **Role-based UI is a convenience, not security.** Hiding the "Mark as claimed" button from non-security users is fine, but the backend middleware is the only real enforcement.
- **One component per file**, named the same as the file. Props type is defined above the component and named `<ComponentName>Props`.

## API Route Structure

- **Base path:** `/api/v1`. Resource names are plural, lowercase, kebab-case.
- **Verbs:** `GET` read, `POST` create or trigger an action, `PATCH` partial update. No `PUT`, no `DELETE` in the MVP (listings are removed via moderation, not user deletion).
- **Success envelope:** `{ "data": <payload> }`. **Error envelope:** `{ "error": { "code": "LISTING_NOT_EDITABLE", "message": "..." } }`. Error `code` is a stable `UPPER_SNAKE_CASE` string the frontend can switch on.
- **Status codes:** `200` read/update, `201` create, `400` validation failure, `401` not authenticated, `403` authenticated but wrong role or not the owner, `404` not found, `409` invalid state transition (e.g. claiming an already-claimed listing).
- **Pagination:** list endpoints accept `?page=1&pageSize=20` (max `pageSize` 50) and return `{ "data": [...], "meta": { "page", "pageSize", "total" } }`.

| Method  | Path                                 | Access                        | Purpose                                                                                                             |
| ------- | ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/api/v1/auth/register`              | Public                        | Create account (school-domain email required)                                                                       |
| `POST`  | `/api/v1/auth/login`                 | Public                        | Issue JWT                                                                                                           |
| `GET`   | `/api/v1/auth/me`                    | Authenticated                 | Current user and role                                                                                               |
| `GET`   | `/api/v1/locations`                  | Authenticated                 | List predefined locations for dropdowns                                                                             |
| `GET`   | `/api/v1/found-listings`             | Authenticated                 | Search/filter: `category`, `locationId`, `foundFrom`, `foundTo`, `page`, `pageSize`                                 |
| `POST`  | `/api/v1/found-listings`             | Authenticated                 | Create found listing (`multipart/form-data`, photo included; JPEG/JPG/PNG only, max 10 MB per Cloudinary free tier) |
| `GET`   | `/api/v1/found-listings/:id`         | Authenticated                 | Listing detail                                                                                                      |
| `PATCH` | `/api/v1/found-listings/:id`         | Owner, only while `AVAILABLE` | Correct a mistake in a listing                                                                                      |
| `POST`  | `/api/v1/found-listings/:id/claim`   | `SECURITY`, `ADMIN`           | Mark as `CLAIMED`                                                                                                   |
| `POST`  | `/api/v1/found-listings/:id/reports` | Authenticated                 | Report a listing (adds "under review" badge)                                                                        |
| `GET`   | `/api/v1/lost-listings`              | Authenticated                 | All lost listings (visible to every authenticated user, not owner-only)                                             |
| `POST`  | `/api/v1/lost-listings`              | Authenticated                 | Create lost listing                                                                                                 |
| `PATCH` | `/api/v1/lost-listings/:id`          | Owner                         | Edit own lost listing                                                                                               |
| `GET`   | `/api/v1/admin/reports`              | `ADMIN`                       | Moderation queue (status `PENDING` by default)                                                                      |
| `PATCH` | `/api/v1/admin/reports/:id`          | `ADMIN`                       | Resolve: `DISMISSED` or `REMOVED`                                                                                   |

Action endpoints that are state transitions (`claim`) are `POST` sub-resources, not `PATCH` on `status`, so clients can never set `status` directly.

## File Organization

```
backend/
  prisma/
    schema.prisma
    seed.ts                 # seeds Location rows (campus locations, security posts)
  src/
    config/
      constants.ts          # LISTING_EXPIRY_DAYS, limits
      env.ts                # Zod-validated environment variables
    routes/                 # one file per resource, e.g. found-listings.routes.ts
    controllers/            # found-listings.controller.ts
    services/               # found-listings.service.ts, listing-expiry.ts
    middleware/             # require-auth.ts, require-role.ts, error-handler.ts
    lib/
      prisma.ts             # the single Prisma client
      cloudinary/           # upload/delete helpers
      email/                # school-domain check
    schemas/                # Zod schemas, one file per resource
    errors/
      app-error.ts
    app.ts                  # builds the Express app
    server.ts               # starts listening
frontend/
  src/
    api/                    # typed fetch functions, one file per resource
    components/             # reusable UI: ListingCard.tsx, FilterBar.tsx, StatusBadge.tsx
    pages/                  # route-level views
    hooks/                  # shared hooks, e.g. useAuth.ts
    types/                  # types mirroring API responses
    lib/                    # query client, utilities
    main.tsx
```

- **Naming pattern:** `<resource>.<layer>.ts` on the backend (`found-listings.service.ts`). The suffix makes the layer visible in search results and imports.
- **No cross-layer imports upward.** A service must not import from `controllers/` or `routes/`.
- **No barrel files (`index.ts` re-exports)** except at `frontend/src/components/` if the list grows large. They hide circular imports.
- **Tests sit next to the file they cover** (`found-listings.service.test.ts`). Service-layer tests are the priority; they cover expiry, edit rules, and claim transitions.
- **Environment variables** are read only in `config/env.ts` and nowhere else. Secrets (JWT secret, Cloudinary keys, `DATABASE_URL`) are never committed; `.env.example` lists names without values.

## Styling Rules

- **Tailwind CSS is the only styling system.** No CSS-in-JS, no inline `style={{}}` (exception: dynamic values that Tailwind cannot express, such as a computed width).
- **Design tokens live in `tailwind.config.ts`:** colors, spacing scale, font sizes. Components use token classes (`bg-brand-600`), not arbitrary values (`bg-[#3b82f6]`).
- **Status-to-style mapping is a single constant,** not scattered conditionals. `AVAILABLE`, `CLAIMED`, `EXPIRED`, and the "under review" state each map to one badge style in `StatusBadge.tsx`; every screen uses that component.
- **Mobile first.** Write base classes for small screens and add `sm:`/`md:`/`lg:` for larger ones. Students will mostly use this on phones, standing at a security post.
- **Accessibility minimums:** every image has meaningful `alt` text (the listing description for item photos), every form input has an associated `<label>`, interactive elements are real `<button>`/`<a>` elements, and color is never the only signal for status (badges include text).
- **Class ordering is automated** with `prettier-plugin-tailwindcss`. Do not hand-sort classes.
- **Repeated class groups become components, not `@apply` rules.** If the same ten classes appear three times, extract a component.

## Tooling

- **ESLint** with `@typescript-eslint` (recommended + strict), plus `eslint-plugin-react-hooks`.
- **Prettier** for formatting; formatting is never debated in review.
- **Pre-commit check** (husky + lint-staged) runs ESLint and `tsc --noEmit` on changed files.
- **Migrations:** every schema change is a Prisma migration (`prisma migrate dev`), committed with the code that needs it. Never edit the database by hand.
