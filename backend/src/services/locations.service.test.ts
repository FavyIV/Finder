import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listLocations } from './locations.service';

describe('LocationsService', () => {
  it('should list all predefined campus locations in alphabetical order', async () => {
    const locations = await listLocations();

    assert.ok(Array.isArray(locations));
    assert.ok(locations.length > 0);

    // Verify properties
    const first = locations[0];
    assert.ok(first?.id);
    assert.ok(first?.name);
    assert.equal(typeof first?.isSecurityPost, 'boolean');

    // Verify alphabetical ordering
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1]?.name ?? '';
      const curr = locations[i]?.name ?? '';
      assert.ok(prev.localeCompare(curr) <= 0);
    }
  });
});
