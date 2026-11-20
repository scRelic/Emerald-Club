import test from 'node:test';
import assert from 'node:assert/strict';
import { createPokerController } from './pokerController.js';

test('rejects a poker buy-in above the player balance without changing chips', async () => {
    const queries = [];
    const client = {
        async query(sql) {
            queries.push(sql);
            if (sql.startsWith('SELECT id, chips')) {
                return {
                    rows: [{ id: 'player-1', chips: 800, daily_bonus_last_claimed_at: null }],
                    rowCount: 1,
                };
            }
            if (sql.includes('SELECT response FROM player_operation_requests')) {
                return { rows: [], rowCount: 0 };
            }
            if (sql.includes("game = 'poker' FOR UPDATE")) {
                return { rows: [], rowCount: 0 };
            }
            throw new Error(`Unexpected SQL in test: ${sql}`);
        },
    };
    const controller = createPokerController({
        transaction: (callback) => callback(client),
        randomInt: (minimum, maximum) => Math.min(minimum + 2, maximum - 1),
    });
    const response = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };

    await controller.sitAtPokerTable({
        authSession: { player: { id: 'player-1' } },
        body: {
            requestId: '4b9b2b9e-32d8-4cd7-8fa9-53d1c0184c56',
            tableId: 'vip',
            buyIn: 1000,
        },
    }, response, (error) => {
        throw error;
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.message, 'Недостаточно фишек для входа за этот стол.');
    assert.equal(queries.some((sql) => sql.startsWith('UPDATE players')), false);
    assert.equal(queries.some((sql) => sql.includes('INSERT INTO chip_transactions')), false);
    assert.equal(queries.some((sql) => sql.includes("INSERT INTO player_game_sessions")), false);
});
