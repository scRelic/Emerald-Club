import test from 'node:test';
import assert from 'node:assert/strict';
import { createCsrfProtection } from './csrfProtection.js';

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

const createRequest = (method, origin) => ({
    method,
    get: (name) => (name.toLowerCase() === 'origin' ? origin : undefined),
});

test('allows production mutations only from configured client origins', () => {
    const middleware = createCsrfProtection({
        allowedOrigins: ['https://club.example'],
        isProduction: true,
    });
    const trustedResponse = createResponse();
    let trustedNextCalled = false;

    middleware(createRequest('POST', 'https://club.example'), trustedResponse, () => {
        trustedNextCalled = true;
    });

    assert.equal(trustedNextCalled, true);

    const rejectedResponse = createResponse();
    let rejectedNextCalled = false;
    middleware(createRequest('POST', 'https://attacker.example'), rejectedResponse, () => {
        rejectedNextCalled = true;
    });

    assert.equal(rejectedNextCalled, false);
    assert.equal(rejectedResponse.statusCode, 403);
});

test('rejects originless mutations and allows safe requests', () => {
    const middleware = createCsrfProtection({
        allowedOrigins: ['https://club.example'],
        isProduction: true,
    });
    const originlessResponse = createResponse();
    middleware(createRequest('PUT', undefined), originlessResponse, () => {});

    assert.equal(originlessResponse.statusCode, 403);

    const safeResponse = createResponse();
    let safeNextCalled = false;
    middleware(createRequest('GET', undefined), safeResponse, () => {
        safeNextCalled = true;
    });

    assert.equal(safeNextCalled, true);
    assert.equal(safeResponse.statusCode, 200);
});
