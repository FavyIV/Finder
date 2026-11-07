# Backend API Testing Guide with Thunder Client (Free Edition)

This guide walks you through testing the **Campus Lost & Found** backend API using the **free version of Thunder Client** (VS Code / Antigravity extension).

No Thunder Client Premium features (like automated scripting or paid runner plans) are required. Everything is configured using standard Collections, Free Environments, and manual token copy-pasting.

---

## 1. Prerequisites & Setup

### 1.1 Ensure Backend is Running

Before making requests, make sure PostgreSQL is running and your backend server is up:

```bash
# In your terminal
pnpm --filter backend run dev
```

You should see:

```
[server] Running on port 3001 (development)
```

> **Base URL:** `http://localhost:3001/api/v1`

---

### 1.2 Setting Up Thunder Client Environment (Free)

1. Open **Thunder Client** in the sidebar.
2. Click on the **Env** tab (the box with `{}` icon).
3. Click **New Environment** and name it `Campus LAF Local`.
4. Add the following variables:

| Variable        | Value                          | Description                    |
| --------------- | ------------------------------ | ------------------------------ |
| `baseUrl`       | `http://localhost:3001/api/v1` | Root API path                  |
| `userToken`     | _(Leave empty for now)_        | JWT for regular student user   |
| `securityToken` | _(Leave empty for now)_        | JWT for security staff officer |
| `adminToken`    | _(Leave empty for now)_        | JWT for campus administrator   |

5. Click the three dots `...` beside `Campus LAF Local` and select **Set as Active**.

---

### 1.3 Key Rules to Keep in Mind

- **Email Domain:** The backend strictly requires school email addresses ending with `@futa.edu.ng`.
- **Roles:** Allowed values are `USER`, `SECURITY`, `ADMIN`.
- **Authentication:** Protected endpoints require the header:
  ```http
  Authorization: Bearer {{token}}
  ```
- **Categories:** Must be one of:
  `ELECTRONICS`, `KEYS`, `DOCUMENTS`, `BAGS`, `CLOTHING`, `ACCESSORIES`, `BOOKS`, `OTHER`.

---

## 2. Authentication Flow (Public)

Create a collection named **01. Authentication**.

### 2.1 Register a Regular Student Account

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Jane Doe",
    "email": "janedoe@futa.edu.ng",
    "password": "Password123!",
    "role": "USER"
  }
  ```
- **Expected Status:** `201 Created`
- **Response Shape:**
  ```json
  {
    "data": {
      "user": {
        "id": "cuid...",
        "email": "janedoe@futa.edu.ng",
        "name": "Jane Doe",
        "role": "USER"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

---

### 2.2 Register a Security Officer Account

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Officer Ade",
    "email": "security.southgate@futa.edu.ng",
    "password": "Password123!",
    "role": "SECURITY"
  }
  ```
- **Expected Status:** `201 Created`

---

### 2.3 Register an Admin Account

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Campus Moderator",
    "email": "admin.dsa@futa.edu.ng",
    "password": "Password123!",
    "role": "ADMIN"
  }
  ```
- **Expected Status:** `201 Created`

---

### 2.4 Login & Saving Tokens

- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "email": "janedoe@futa.edu.ng",
    "password": "Password123!"
  }
  ```
- **Expected Status:** `200 OK`
- **What to do:**
  1. Copy the `data.token` string from the response.
  2. Open the **Env** tab in Thunder Client.
  3. Paste it into the `userToken` variable value.
  4. Repeat login for security and admin accounts and paste their tokens into `securityToken` and `adminToken`.

---

### 2.5 Get Current Profile (`/auth/me`)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/auth/me`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Expected Status:** `200 OK`

---

## 3. Campus Locations (Predefined Drop-Off Posts)

Create a collection named **02. Locations**.

### 3.1 List Seeded Campus Locations

- **Method:** `GET`
- **URL:** `{{baseUrl}}/locations`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Expected Status:** `200 OK`
- **Notes:** Keep one location's `id` handy (e.g. Southgate Security Post) for creating found listings.

---

## 4. Found Listings & Drop-off Flow

Create a collection named **03. Found Listings**.

### 4.1 Create a Found Listing (With Photo Upload)

Found listings require dropping off the item at a security post first and uploading a photo (JPEG, JPG, or PNG, max 10MB).

- **Method:** `POST`
- **URL:** `{{baseUrl}}/found-listings`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Body:** Select **Form-data** (NOT JSON)
- **Form-data Fields:**

| Key           | Type     | Value / Example                                                |
| ------------- | -------- | -------------------------------------------------------------- |
| `photo`       | **File** | Select a real image file from your computer (`.jpg` or `.png`) |
| `category`    | Text     | `ELECTRONICS`                                                  |
| `locationId`  | Text     | `<Paste Location ID from Section 3.1>`                         |
| `foundAt`     | Text     | `2026-11-07T09:30:00.000Z`                                     |
| `description` | Text     | `Black HP 65W laptop charger with slight fray on cable`        |

- **Expected Status:** `201 Created`
- **Notes:** Copy the returned `data.id` to test detail, edit, and claim endpoints.

---

### 4.2 Search / Filter Found Listings

- **Method:** `GET`
- **URL:** `{{baseUrl}}/found-listings`
- **Query Parameters:**
  - `category`: `ELECTRONICS` _(optional)_
  - `locationId`: `<Location ID>` _(optional)_
  - `page`: `1` _(optional)_
  - `pageSize`: `20` _(optional)_
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Expected Status:** `200 OK`
- **Verification:** Confirm that:
  - Only non-expired items (`< 30 days old`) are returned.
  - Items with `removedAt` (moderated items) are excluded.
  - Contact info (email/phone) is never present (**Invariant #6**).

---

### 4.3 Get Listing by ID

- **Method:** `GET`
- **URL:** `{{baseUrl}}/found-listings/<LISTING_ID>`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Expected Status:** `200 OK`
- **Response Shape:** Includes `isUnderReview: false`, `location`, and sanitized `reportedBy` (name only).

---

### 4.4 Edit Listing (Owner Only, `AVAILABLE` Only)

The reporter can update mistake fields or replace the photo while the item is `AVAILABLE`.

- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/found-listings/<LISTING_ID>`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Body:** **Form-data**
  - `description`: `Black HP 65W laptop charger with blue indicator tape`
- **Expected Status:** `200 OK`

_(Optional Negative Test: Try sending this request with `Authorization: Bearer {{securityToken}}`. Expected status: `403 Forbidden` with `NOT_LISTING_OWNER`)._

---

### 4.5 Claim Item at Security Desk (`SECURITY` or `ADMIN` Only)

When the student physically goes to the security post, presents their ID, and retrieves the item, security logs the handover.

- **Method:** `POST`
- **URL:** `{{baseUrl}}/found-listings/<LISTING_ID>/claim`
- **Headers:**
  - `Authorization`: `Bearer {{securityToken}}`
- **Expected Status:** `200 OK`
- **Verification:** Listing status transitions to `CLAIMED` and records `claimedById`.

_(Optional Negative Test 1: Try running this with `{{userToken}}`. Expected: `403 Forbidden`)._
_(Optional Negative Test 2: Try running claim again on the same ID. Expected: `409 Conflict` with `ALREADY_CLAIMED`)._

---

## 5. Listing Moderation & Reporting Flow

Create a collection named **04. Moderation**.

### 5.1 Report a Listing (`USER` / Authenticated)

A user can flag a suspicious or spam listing.

- **Method:** `POST`
- **URL:** `{{baseUrl}}/found-listings/<LISTING_ID>/report`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "reason": "This listing contains a stock image downloaded from Google Images."
  }
  ```
- **Expected Status:** `201 Created`
- **Verification:**
  - Re-run `GET {{baseUrl}}/found-listings/<LISTING_ID>`.
  - Notice `isUnderReview: true` (**Invariant #5** - listing remains visible, flagged for review).

---

### 5.2 View Moderation Queue (`ADMIN` Only)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/admin/reports?status=PENDING`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Expected Status:** `200 OK`
- **Notes:** Copy the `id` of the newly created report.

---

### 5.3 Resolve Report (`ADMIN` Only)

Admins can either dismiss the report or remove the listing.

#### Option A: Dismiss Report (Listing remains active, badge clears)

- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/admin/reports/<REPORT_ID>`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "status": "DISMISSED"
  }
  ```
- **Expected Status:** `200 OK`

#### Option B: Remove Listing (Listing hidden permanently)

- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/admin/reports/<REPORT_ID>`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "status": "REMOVED"
  }
  ```
- **Expected Status:** `200 OK`
- **Verification:** `GET {{baseUrl}}/found-listings/<LISTING_ID>` now returns `404 LISTING_NOT_FOUND` and disappears from search results.

---

## 6. Lost Listings Notices Flow

Create a collection named **05. Lost Listings**.

### 6.1 Post a Lost Item Notice

- **Method:** `POST`
- **URL:** `{{baseUrl}}/lost-listings`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "category": "BOOKS",
    "description": "Calculus: Early Transcendentals (8th Ed) with blue spiral notebook left in ETF Lecture Theatre 2"
  }
  ```
- **Expected Status:** `201 Created`

---

### 6.2 Browse Lost Listings (All Authenticated Users)

- **Method:** `GET`
- **URL:** `{{baseUrl}}/lost-listings`
- **Query Parameters:**
  - `category`: `BOOKS` _(optional)_
  - `mineOnly`: `true` _(optional, filters to your own notices)_
  - `page`: `1`
  - `pageSize`: `20`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
- **Expected Status:** `200 OK`

---

### 6.3 Update Own Lost Listing

- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/lost-listings/<LOST_LISTING_ID>`
- **Headers:**
  - `Authorization`: `Bearer {{userToken}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "description": "Calculus: Early Transcendentals (8th Ed) with yellow sticky notes on Chapter 4"
  }
  ```
- **Expected Status:** `200 OK`

---

## 7. Troubleshooting Common Errors in Thunder Client

| Error Code / Message           | HTTP Status | Cause & Solution                                                                                                                            |
| ------------------------------ | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `UNAUTHORIZED`                 |    `401`    | Missing or invalid `Authorization: Bearer <token>` header. Verify token is pasted into active environment.                                  |
| `FORBIDDEN` / `FORBIDDEN_ROLE` |    `403`    | Current account role doesn't have permission (e.g. `USER` trying to claim or access `/admin/reports`). Use `securityToken` or `adminToken`. |
| `INVALID_EMAIL_DOMAIN`         |    `400`    | Registration email does not end with `@futa.edu.ng`.                                                                                        |
| `LISTING_NOT_EDITABLE`         |    `409`    | You attempted to edit a listing that has already been `CLAIMED` or has `EXPIRED` (> 30 days).                                               |
| `REPORT_ALREADY_SUBMITTED`     |    `409`    | Each user is limited to 1 report per listing.                                                                                               |
| `CANNOT_REPORT_OWN_LISTING`    |    `400`    | You cannot submit a report on your own listing.                                                                                             |
| `Unexpected field` (Multer)    |    `400`    | In `POST /found-listings`, the file field must be named exactly `photo`.                                                                    |
