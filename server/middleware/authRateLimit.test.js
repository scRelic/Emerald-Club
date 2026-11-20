import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { createAuthRateLimiter } from './authRateLimit.js';

test('limits repeated authentication attempts from the same IP', async () => {
    const app = express();
    app.set('trust proxy', 0);
    app.post(
        '/login',
        createAuthRateLimiter({
            windowMs: 60_000,
            limit: 2,
            message: 'Too many attempts.',
        }),
        (req, res) => res.status(401).json({ message: 'Invalid credentials.' }),
    );

    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}/login`;
        const first = await fetch(url, { method: 'POST' });
        const second = await fetch(url, { method: 'POST' });
        const limited = await fetch(url, { method: 'POST' });

        assert.equal(first.status, 401);
        assert.equal(second.status, 401);
        assert.equal(limited.status, 429);
        assert.match((await limited.json()).message, /Too many attempts/);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});
