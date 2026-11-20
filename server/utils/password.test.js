import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from './password.js';

test('password hashes can be verified without storing the original password', async () => {
    const password = 'emerald-secret-123';
    const encodedHash = await hashPassword(password);

    assert.notEqual(encodedHash, password);
    assert.equal(await verifyPassword(password, encodedHash), true);
    assert.equal(await verifyPassword('wrong-password', encodedHash), false);
});

test('malformed password hashes are rejected', async () => {
    assert.equal(await verifyPassword('password', 'not-a-hash'), false);
});
