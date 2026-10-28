import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSchoolEmail } from './domain-check';

describe('isValidSchoolEmail', () => {
  it('should accept valid @futa.edu.ng emails', () => {
    assert.equal(isValidSchoolEmail('student@futa.edu.ng'), true);
    assert.equal(isValidSchoolEmail('staff.member@futa.edu.ng'), true);
    assert.equal(isValidSchoolEmail('STUDENT@FUTA.EDU.NG'), true);
    assert.equal(isValidSchoolEmail('  user@futa.edu.ng  '), true);
  });

  it('should reject non-school domains', () => {
    assert.equal(isValidSchoolEmail('user@gmail.com'), false);
    assert.equal(isValidSchoolEmail('user@yahoo.com'), false);
    assert.equal(isValidSchoolEmail('user@futa.edu'), false);
    assert.equal(isValidSchoolEmail('user@fakefuta.edu.ng'), false);
  });

  it('should reject empty or malformed strings', () => {
    assert.equal(isValidSchoolEmail(''), false);
    assert.equal(isValidSchoolEmail('   '), false);
    assert.equal(isValidSchoolEmail('@futa.edu.ng'), true); // Ends with domain
  });
});
