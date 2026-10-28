# Campus Lost & Found — Project Overview

## Overview

Campus Lost & Found is a web application that helps students and staff at a single campus report, discover, and recover lost or found items. When someone finds an item, they drop it off at the nearest campus security/porter post and log it in the app with a photo, category, location, and date/time found. When someone loses an item, they search existing found-item listings using structured filters; if no match exists, they post a lost-item listing instead. All physical handoffs happen in person at the security post where the item was dropped off — the app never brokers direct contact or a meetup between the finder and the loser. Access is restricted to verified members of the campus community via school-email verification, and a lightweight moderation system lets users flag suspicious listings for admin review.

## Goals

1. A student can report a found item in under 2 minutes, including photo upload.
2. A student searching for a lost item can filter found listings by category, location, and date, and get results without needing free-text search.
3. 100% of found-item handoffs happen through a security post — the app never exposes a direct communication channel between finder and loser.
4. Every account is verified against the school's email domain before it can create or view listings.
5. A found item that goes unclaimed is automatically treated as expired 30 days after it was logged.
6. Fraudulent or spam listings can be reported by any user and reviewed by an admin, with the listing remaining visible (marked "under review") throughout that process.

## Core User Flow

**Reporting a found item:**

1. User finds an item on campus.
2. User walks the item to the nearest security/porter post and hands it over.
3. User (or security staff on the user's behalf) logs into the app.
4. User creates a new found-item listing: uploads a photo, selects a category, selects the drop-off location from a predefined dropdown, sets the date/time found, and adds an optional free-text description.
5. Listing is saved with status `AVAILABLE` and becomes visible in search.

**Recovering a lost item:**

1. User loses an item on campus.
2. User logs into the app and searches found-item listings, filtering by category, location, and/or date range.
3. User browses the list of candidate matches, using each listing's photo and free-text description to judge fit.
4. If a match looks right, the app displays the listing's drop-off location (a specific security post).
5. User travels to that security post in person to claim the item.
6. Security staff verifies the claimant (e.g. asks them to describe the item, checks student ID) and marks the listing as `CLAIMED` in the app.
7. If no match is found, the user instead posts a lost-item listing (category + free-text description) so it's on record, though no automated matching or notification occurs against it.

**Moderation (parallel to the above):**

1. Any user can tap "report" on a found-item listing they believe is fraudulent or spam.
2. The listing immediately displays an "under review" badge but stays visible to all users.
3. An admin reviews reported listings (and periodically browses all listings independently).
4. Admin either dismisses the report (badge is removed) or removes the listing entirely.

## Features by Category

**Accounts & Access**

- Sign-up/login restricted to verified school email addresses (domain check)
- Three roles: regular user, security staff, admin

**Found-Item Reporting**

- Create listing: photo (via Cloudinary), category, location (dropdown), date/time found, free-text description
- Listing status lifecycle: `AVAILABLE` → `CLAIMED` or `EXPIRED`
- 30-day automatic expiry for unclaimed items (computed from creation date, not a background job for MVP)

**Search & Discovery**

- Filter found-item listings by category, location, and date/time range
- Browse candidate matches as a list (no auto-matching or notifications)
- Post a lost-item listing (category + free-text description) when no match is found

**Claim & Handoff**

- Security staff role can mark a found-item listing as claimed
- No in-app messaging or direct contact exchange between finder and loser at any point

**Moderation**

- "Report this listing" action available to any user
- Reported listings display an "under review" badge but remain visible
- Admin queue to dismiss or remove reported listings
- Admin can also browse all listings independently of reports

## In Scope

- Single-campus deployment (one set of predefined locations, no multi-tenant support)
- School-email-verified accounts with three roles: user, security staff, admin
- Found-item listing creation requiring prior physical drop-off at a security post
- Lost-item listing creation (search-first, post-if-no-match)
- Structured search/filtering by category, location, and date/time
- Photo upload and storage via Cloudinary
- Listing status lifecycle: available, claimed, expired (30-day computed expiry)
- Report-listing feature for users
- Admin moderation queue for reported/spam listings
- PostgreSQL database via Prisma ORM
- React frontend, Node.js/Express backend

## Out of Scope (for MVP)

- Push notifications or email alerts (e.g. notifying a user when a new listing matches their lost-item search)
- In-app messaging or chat of any kind between users
- Image-based similarity matching or any automated matching/notification between lost and found listings
- Multi-campus or multi-institution support
- Analytics or reporting dashboards
- Rewards, "thank you" mechanisms, or gamification for finders
- Any in-app handling of item handoff logistics beyond directing the user to a physical security post (no scheduling, no delivery, no courier flow)
- Full student-ID or document-based identity verification (MVP uses school-email domain check only)
- A general-purpose admin back-office beyond moderating reported/spam listings

## Success Criteria

- A user can sign up with a valid school email and cannot sign up with a non-school email.
- A signed-in user can create a found-item listing with a photo, category, location, date/time, and description, and the listing appears correctly in search results.
- A signed-in user can filter found-item listings by category, location, and date/time and see only listings matching all applied filters.
- A signed-in user can post a lost-item listing when no found-item match exists.
- A security-staff account can mark a found-item listing as claimed, and the listing's status updates accordingly and is reflected in search (no longer shown as available).
- A found-item listing automatically stops appearing as available 30 days after creation if it has not been claimed.
- Any signed-in user can report a listing, the listing immediately shows an "under review" badge, and it remains visible to other users while under review.
- An admin account can view reported listings and either dismiss the report or remove the listing, with the outcome reflected immediately in the app.
- A user without a security-staff or admin role cannot access claim-marking or moderation actions.
