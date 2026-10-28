# Campus Lost & Found — AI Workflow Rules

You are an AI coding agent building this project. These rules are binding. Follow them on every task, in every session. If a user instruction conflicts with a rule here, say so and ask which one takes priority before acting.

## Source Documents

Read these before writing any code, and re-read the relevant parts before each new unit of work:

| File                   | Defines                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `project-overview.md`  | What the product does, in scope, out of scope, success criteria             |
| `architecture.md`      | Stack, layer boundaries, storage model, auth model, invariants              |
| `code-standards.md`    | TypeScript, Express, React, API route, file organization, and styling rules |
| `prisma/schema.prisma` | The data model                                                              |

These documents are the spec. If code and spec disagree, the spec is correct until the user says otherwise.

## Overall Approach

- Work spec-first. Before writing code for a unit, identify which spec sections it implements and state them in one or two sentences.
- Work incrementally. Build one small, working, verifiable unit at a time, in dependency order. Never build a layer ahead of the unit that needs it.
- Keep the project runnable. After each unit, the backend must start, the frontend must build, and existing features must still work.
- Follow the build order unless the user says otherwise:
  1. Project setup (repo structure, tooling, env validation, Prisma connection)
  2. Seed data (`Location` rows)
  3. Auth (register with school-domain check, login, `requireAuth`, `requireRole`)
  4. Found listing create (including Cloudinary upload)
  5. Found listing search and detail
  6. Found listing edit (owner, `AVAILABLE` only)
  7. Claim action (`SECURITY`, `ADMIN`)
  8. Report listing and "under review" badge
  9. Admin moderation queue
  10. Lost listings (create, list own, edit)
  11. Expiry handling and final hardening

## Scoping Rules

- Work on one feature unit at a time. A unit is one user-visible capability, implemented end to end (route, controller, service, schema validation, frontend API function, UI, tests).
- State the unit you are starting and its acceptance criteria before you write code. Take the criteria from `project-overview.md` success criteria.
- Make only the changes the current unit requires. Do not refactor, rename, reformat, or "clean up" code outside the unit.
- Do not add features, endpoints, fields, columns, dependencies, or configuration the spec does not call for. This includes "nice to have" additions such as soft delete, extra roles, notifications, or caching.
- Do not build anything listed under "Out of Scope" in `project-overview.md`. If you believe an out-of-scope item is needed, stop and ask.
- Do not add a new dependency without asking. When you ask, name the package, what it replaces or enables, and why the existing stack cannot do it.
- Do not change a decision recorded in the spec to suit your implementation. Propose the change to the user and wait.
- Do not leave `TODO` comments as a substitute for finishing a unit. Either finish it or report it as incomplete.

## When to Split Work Into Smaller Steps

Split the unit before starting if any of these is true:

- It touches more than one layer boundary in a way that cannot be verified separately (for example, a schema change plus a new endpoint plus a new page).
- It requires a Prisma schema change. Do the schema change and migration as its own step, get it approved, then build on it.
- It would change more than roughly 10 files.
- You cannot describe its acceptance criteria in three sentences.
- You cannot test it without first building something that does not exist yet.

When you split, list the steps, state the order, and begin with the first. Do not start step two until step one passes the verification checklist.

## Missing or Ambiguous Requirements

When a requirement is missing, ambiguous, or contradicted by another document:

1. Stop work on the affected part. Continue only on parts that do not depend on the answer.
2. Do not guess. Do not choose a default silently. Do not implement the "most likely" behavior.
3. Tell the user exactly what is undefined, quoting the spec sections involved.
4. Offer two or three concrete options with the consequence of each, and state which one you recommend and why.
5. Wait for the answer.
6. After the answer, record the decision in the correct spec document in the same change as the code. A decision that exists only in chat does not exist.

Resolved decisions (all open questions answered — no remaining blockers):

- **Editing a listing with a `PENDING` report requires re-review.** When a listing that has a `PENDING` report is edited by its owner, the report status is reset to `PENDING` (if it was already pending, it remains pending and the admin must re-review). Decision: editing does not dismiss the report; the listing continues to show the "under review" badge.
- **Lost listings are visible to all authenticated users** (not owner-only), so that lost items can be discovered and traced back to their owners by anyone on campus.
- **School email domain is `@futa.edu.ng`.** Only addresses ending in `@futa.edu.ng` may register. This value lives in `config/constants.ts` as `SCHOOL_EMAIL_DOMAIN` and is read from there by the email-verification logic in `src/lib/email/`.
- **Campus locations with security posts** include (at minimum): School of Computing, School of Engineering, School of Agriculture, Southgate, Northgate, and every faculty/lecture theatre. The exact seed list will be finalised as a named constant in `prisma/seed.ts` before Step 2 begins.
- **Allowed image types: JPEG, JPG, PNG.** Maximum file size is governed by Cloudinary's free-tier upload limit (10 MB). The client-side limit constant `MAX_PHOTO_SIZE_BYTES` and the allowed types array `ALLOWED_PHOTO_TYPES` live in `config/constants.ts`.

Never invent values for secrets, domains, location names, or credentials. Use environment variables and `.env.example` placeholders, and ask for real values.

## Protected Files

Do not modify these files unless the user explicitly instructs you to, naming the file or the action:

| Path                                                                                                                   | Rule                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `prisma/migrations/**` (already applied)                                                                               | Never edit or delete an existing migration. Create a new migration instead.                                              |
| `prisma/schema.prisma`                                                                                                 | Change only as the approved first step of a split unit. Every change requires a new migration in the same change.        |
| `node_modules/`, generated Prisma client output                                                                        | Never edit. Regenerate with `prisma generate`.                                                                           |
| `package-lock.json` (or equivalent lockfile)                                                                           | Never edit by hand. Change it only through the package manager.                                                          |
| `.env`, any file containing real secrets                                                                               | Never read values into output, never commit, never modify. Edit `.env.example` only.                                     |
| `project-overview.md`, `architecture.md`, `code-standards.md`                                                          | Edit only to record an approved decision or to sync documentation (see below). Never edit them to make your code comply. |
| Generated or vendored UI library components (for example, a `components/ui/` folder produced by a component generator) | Never hand-edit. Wrap or compose them in a new component. Regenerate through the generator if a change is needed.        |
| Build output (`dist/`, `build/`)                                                                                       | Never edit.                                                                                                              |
| CI, deployment, and hosting configuration                                                                              | Do not create or change without instruction.                                                                             |

If a protected file seems to need a change to complete your unit, stop and ask.

## Keeping Documentation in Sync

- Update documentation in the same change as the code that makes it stale. Never defer it to a later task.
- When you add, rename, or remove an endpoint, update the route table in `code-standards.md` in the same change.
- When you change the schema, update `architecture.md` (storage model, access model) if the change affects them, and confirm `prisma/schema.prisma` matches what the docs describe.
- When you add or remove a folder or change a layer's responsibility, update the System Boundaries table in `architecture.md` and the file tree in `code-standards.md`.
- When the user answers an open question, record the answer in the correct document and delete the item from "Known open questions" above.
- When you find the docs wrong or contradictory, do not silently fix them. Report the discrepancy and propose the correction.
- Keep `.env.example` current: every environment variable the code reads must appear in it, without a real value.
- End every unit with a short summary: what you built, which docs you changed, and what the next unit is.

## Verification Checklist

Before declaring a unit complete or starting the next one, run every check and report the result of each. Do not skip a check. If a check fails, fix it or report it. Never move on with a failing check.

1. **Type check:** `tsc --noEmit` passes in both `backend/` and `frontend/` with zero errors.
2. **Lint and format:** ESLint and Prettier pass with zero errors and zero new warnings.
3. **Tests:** All existing tests pass. Add tests for new service-layer logic (rules, state transitions, expiry, permissions). A unit with new business logic and no tests is not complete.
4. **App runs:** The backend starts and the frontend builds without errors.
5. **Acceptance criteria:** Exercise the unit's acceptance criteria against the running app or with request-level tests, and report what you observed. "Should work" is not a result.
6. **Permissions:** For every new or changed endpoint, confirm that an unauthenticated request gets `401`, a wrong-role request gets `403`, and a non-owner edit gets `403`.
7. **Invariants:** Check the unit against every invariant in `architecture.md`. Name any invariant the unit touches and state how it is upheld.
8. **Layer boundaries:** Confirm no controller calls Prisma, no route contains logic, no component calls `fetch` directly, and no environment variable is read outside `config/env.ts`.
9. **Scope check:** Review the diff. Every changed line must trace to the unit. Revert anything that does not.
10. **Documentation:** Confirm the sync rules above were applied and list the docs you changed.
11. **Migrations:** If the schema changed, confirm a new migration exists, applies cleanly to an empty database, and the seed script still runs.
12. **Secrets:** Confirm no secret, token, or real credential appears in the diff, logs, or test fixtures.

## Reporting

- Report facts, not reassurance. State what you ran, what passed, what failed, and what you did not verify.
- If you could not run a check, say which one and why. Never claim a check passed without running it.
- If you made a mistake, say so, fix it, and re-run the affected checks.
- When a unit is done, stop and wait for the user's go-ahead before starting the next one.
