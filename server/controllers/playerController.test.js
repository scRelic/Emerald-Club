import test from 'node:test';
import assert from 'node:assert/strict';
import { rejectPlayerStateUpdate } from './playerController.js';

test('rejects client attempts to update authoritative player state', () => {
    const response = {
        statusCode: 0,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };

    rejectPlayerStateUpdate({}, response);

    assert.equal(response.statusCode, 410);
    assert.equal(response.body.message, 'Сохранение игрового состояния с клиента отключено.');
});
