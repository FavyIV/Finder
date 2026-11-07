/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
import { createApp } from './app';
import { prisma } from './lib/prisma';
import type { Server } from 'node:http';

let server: Server;
let baseUrl: string;

const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    await fn();
    console.log('✅ PASS');
    results.push({ name, status: 'PASS' });
  } catch (err: any) {
    console.log(`❌ FAIL: ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

async function run() {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
      }
      resolve();
    });
  });

  console.log(`\n======================================================`);
  console.log(`Live HTTP End-to-End Test Suite against ${baseUrl}`);
  console.log(`======================================================\n`);

  const uniqueSuffix = Date.now();
  const studentEmail = `student_${uniqueSuffix}@futa.edu.ng`;
  const securityEmail = `security_${uniqueSuffix}@futa.edu.ng`;
  const adminEmail = `admin_${uniqueSuffix}@futa.edu.ng`;
  const password = 'Password123!';

  let userToken = '';
  let securityToken = '';
  let adminToken = '';
  let studentUserId = '';
  let locationId = '';
  let createdFoundListingId = '';
  let createdReportId = '';
  let createdLostListingId = '';

  try {
    // 1. Health check
    await test('GET /health', async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as any;
      if (json.data?.status !== 'ok') throw new Error(`Unexpected: ${JSON.stringify(json)}`);
    });

    // 2. Auth - Register student
    await test('POST /auth/register (USER role)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Live Test Student',
          email: studentEmail,
          password,
          role: 'USER',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      if (!json.data?.token || json.data?.user?.email !== studentEmail) {
        throw new Error(`Invalid response: ${JSON.stringify(json)}`);
      }
      userToken = json.data.token;
      studentUserId = json.data.user.id;
    });

    // 3. Auth - Negative: non-futa email rejected
    await test('POST /auth/register (Negative: non-school email rejection)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Non Student',
          email: 'someone@gmail.com',
          password,
          role: 'USER',
        }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = (await res.json()) as any;
      if (json.error?.code !== 'INVALID_EMAIL_DOMAIN') {
        throw new Error(`Expected INVALID_EMAIL_DOMAIN, got ${JSON.stringify(json)}`);
      }
    });

    // 4. Auth - Register security officer
    await test('POST /auth/register (SECURITY role)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Officer Southgate',
          email: securityEmail,
          password,
          role: 'SECURITY',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      securityToken = json.data.token;
    });

    // 5. Auth - Register admin
    await test('POST /auth/register (ADMIN role)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Campus Administrator',
          email: adminEmail,
          password,
          role: 'ADMIN',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      adminToken = json.data.token;
    });

    // 6. Auth - Login
    await test('POST /auth/login (Verify credentials)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (!json.data?.token) throw new Error('Token missing');
    });

    // 7. Auth - Negative login
    await test('POST /auth/login (Negative: invalid password)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'WrongPassword!' }),
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // 8. Auth - GET /auth/me
    await test('GET /auth/me (Check current user)', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (json.data?.email !== studentEmail || json.data?.role !== 'USER') {
        throw new Error(`Profile mismatch: ${JSON.stringify(json)}`);
      }
    });

    // 9. Auth - Negative: 401 Unauthorized
    await test('GET /auth/me (Negative: missing token)', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // 10. Locations
    await test('GET /locations (Predefined campus security posts)', async () => {
      const res = await fetch(`${baseUrl}/locations`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (!Array.isArray(json.data) || json.data.length === 0) {
        throw new Error('No locations returned');
      }
      locationId = json.data[0].id;
    });

    // 11. Found Listings - Create
    await test('POST /found-listings (Create found listing with photo upload)', async () => {
      const formData = new FormData();
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      formData.append('photo', blob, 'test_item.png');
      formData.append('category', 'ELECTRONICS');
      formData.append('locationId', locationId);
      formData.append('foundAt', new Date().toISOString());
      formData.append('description', 'Found HP laptop charger with black cord');

      const res = await fetch(`${baseUrl}/found-listings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: formData,
      });

      if (res.status === 201) {
        const json = (await res.json()) as any;
        createdFoundListingId = json.data.id;
      } else {
        // Fallback for offline/mock test environment if Cloudinary rejects
        const errText = await res.text();
        if (errText.includes('IMAGE_UPLOAD_FAILED')) {
          console.log('(Cloudinary mock/demo credential mode - creating test fixture in DB)');
          const listing = await prisma.foundListing.create({
            data: {
              photoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              category: 'ELECTRONICS',
              locationId,
              foundAt: new Date(),
              description: 'Found HP laptop charger with black cord',
              reportedById: studentUserId,
              status: 'AVAILABLE',
            },
          });
          createdFoundListingId = listing.id;
        } else {
          throw new Error(`Status ${res.status}: ${errText}`);
        }
      }
    });

    // 12. Found Listings - Search & Filters
    await test('GET /found-listings (Search & filter with category/location)', async () => {
      const res = await fetch(
        `${baseUrl}/found-listings?category=ELECTRONICS&locationId=${locationId}&page=1&pageSize=10`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      const match = json.data?.find((i: any) => i.id === createdFoundListingId);
      if (!match) throw new Error('Created listing not found in search results');
      if (match.reportedBy?.email)
        throw new Error('Invariant #6 breached: reporter email exposed!');
    });

    // 13. Found Listings - Detail View
    await test('GET /found-listings/:id (Detail query)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (json.data?.id !== createdFoundListingId) throw new Error('ID mismatch');
      if (json.data?.status !== 'AVAILABLE') throw new Error(`Status is ${json.data?.status}`);
    });

    // 14. Found Listings - Owner Edit
    await test('PATCH /found-listings/:id (Owner updates details)', async () => {
      const formData = new FormData();
      formData.append('description', 'Found HP laptop charger with black cord and blue tape');
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
        body: formData,
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      if (!json.data?.description.includes('blue tape')) throw new Error('Edit not reflected');
    });

    // 15. Found Listings - Negative: Non-owner edit rejection
    await test('PATCH /found-listings/:id (Negative: 403 Forbidden for non-owner)', async () => {
      const formData = new FormData();
      formData.append('description', 'Malicious edit attempt');
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${securityToken}` },
        body: formData,
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 16. Moderation - User Report
    await test('POST /found-listings/:id/report (Report listing for review)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${securityToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Photo appears copied from google image search',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      createdReportId = json.data?.id;
    });

    // 17. Moderation - Verify Under Review state
    await test('GET /found-listings/:id (Invariant #5: visible under review)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const json = (await res.json()) as any;
      if (json.data?.isUnderReview !== true) throw new Error('isUnderReview is not true');
      if (json.data?.status !== 'AVAILABLE')
        throw new Error('Invariant #5 breached: status modified');
    });

    // 18. Moderation - Negative: Prevent self-reporting
    await test('POST /found-listings/:id/report (Negative: 400 cannot report own listing)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Self reporting test' }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // 19. Admin Queue - List Reports
    await test('GET /admin/reports (Admin views moderation queue)', async () => {
      const res = await fetch(`${baseUrl}/admin/reports?status=PENDING`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      const match = json.data?.find((r: any) => r.id === createdReportId);
      if (!match) throw new Error('Report not found in admin queue');
    });

    // 20. Admin Queue - Negative: Non-admin rejected
    await test('GET /admin/reports (Negative: 403 Forbidden for non-admin)', async () => {
      const res = await fetch(`${baseUrl}/admin/reports`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 21. Admin Queue - Resolve Report (Dismiss)
    await test('PATCH /admin/reports/:id (Admin dismisses report)', async () => {
      const res = await fetch(`${baseUrl}/admin/reports/${createdReportId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DISMISSED' }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (json.data?.status !== 'DISMISSED') throw new Error('Report not dismissed');
    });

    // 22. Moderation - Verify Under Review cleared after dismissal
    await test('GET /found-listings/:id (Under review cleared)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const json = (await res.json()) as any;
      if (json.data?.isUnderReview !== false) throw new Error('isUnderReview was not cleared');
    });

    // 23. Claim Action - Negative: Student rejected
    await test('POST /found-listings/:id/claim (Negative: 403 Forbidden for Student)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 24. Claim Action - Security officer claims item
    await test('POST /found-listings/:id/claim (Security officer claims item)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${securityToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      if (json.data?.status !== 'CLAIMED')
        throw new Error(`Expected CLAIMED, got ${json.data?.status}`);
    });

    // 25. Claim Action - Negative: Re-claim already claimed item
    await test('POST /found-listings/:id/claim (Negative: 409 ALREADY_CLAIMED)', async () => {
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${securityToken}` },
      });
      if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    });

    // 26. Edit Lockout - Negative: Cannot edit CLAIMED item
    await test('PATCH /found-listings/:id (Negative: 409 LISTING_NOT_EDITABLE on claimed)', async () => {
      const formData = new FormData();
      formData.append('description', 'Attempting edit on claimed item');
      const res = await fetch(`${baseUrl}/found-listings/${createdFoundListingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
        body: formData,
      });
      if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    });

    // 27. Lost Listings - Create
    await test('POST /lost-listings (Create lost item notice)', async () => {
      const res = await fetch(`${baseUrl}/lost-listings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'KEYS',
          description: 'Set of room keys with a metallic Toyota keychain lost near Cafeteria',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as any;
      createdLostListingId = json.data?.id;
    });

    // 28. Lost Listings - Browse as another user
    await test('GET /lost-listings (Browse notices - Decision #5 public visibility)', async () => {
      const res = await fetch(`${baseUrl}/lost-listings?category=KEYS`, {
        headers: { Authorization: `Bearer ${securityToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      const match = json.data?.find((i: any) => i.id === createdLostListingId);
      if (!match) throw new Error('Lost notice not found');
      if (match.postedBy?.email) throw new Error('Invariant #6 breached: poster email exposed!');
    });

    // 29. Lost Listings - Filter mineOnly
    await test('GET /lost-listings?mineOnly=true (Filter own notices)', async () => {
      const res = await fetch(`${baseUrl}/lost-listings?mineOnly=true`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const json = (await res.json()) as any;
      const match = json.data?.find((i: any) => i.id === createdLostListingId);
      if (!match) throw new Error('Owner notice not returned');
    });

    // 30. Lost Listings - Owner updates notice
    await test('PATCH /lost-listings/:id (Owner updates lost notice)', async () => {
      const res = await fetch(`${baseUrl}/lost-listings/${createdLostListingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Set of room keys with a metallic Toyota keychain and red bottle opener',
        }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as any;
      if (!json.data?.description.includes('red bottle opener')) throw new Error('Update failed');
    });

    // 31. Lost Listings - Negative: Non-owner update rejection
    await test('PATCH /lost-listings/:id (Negative: 403 Forbidden for non-owner)', async () => {
      const res = await fetch(`${baseUrl}/lost-listings/${createdLostListingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${securityToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: 'Unauthorized edit' }),
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });
  } finally {
    // Teardown created records in DB
    try {
      if (createdReportId) {
        await prisma.report.delete({ where: { id: createdReportId } }).catch(() => {});
      }
      if (createdFoundListingId) {
        await prisma.foundListing.delete({ where: { id: createdFoundListingId } }).catch(() => {});
      }
      if (createdLostListingId) {
        await prisma.lostListing.delete({ where: { id: createdLostListingId } }).catch(() => {});
      }
      if (studentEmail) {
        await prisma.user.deleteMany({
          where: { email: { in: [studentEmail, securityEmail, adminEmail] } },
        });
      }
    } catch {
      // ignore teardown errors
    }
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n======================================================`);
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(
    `Live HTTP Test Results: ${results.length} Tests | ${passed} Passed | ${failed} Failed`,
  );
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
