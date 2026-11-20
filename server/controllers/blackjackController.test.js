import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackjackController } from './blackjackController.js';

test('rejects doubling after a hit before issuing any balance writes', async () => {
    const queries = [];
    const client = {
        async query(sql) {
            queries.push(sql);
            if (sql.startsWith('SELECT id, chips')) {
                return {
                    rows: [{ id: 'player-1', chips: 1000, daily_bonus_last_claimed_at: null }],
                    rowCount: 1,
                };
            }
            if (sql.includes('SELECT response FROM player_operation_requests')) {
                return { rows: [], rowCount: 0 };
            }
            if (sql.includes('SELECT state FROM player_game_sessions')) {
                return {
                    rows: [{
                        state: {
                            status: 'playing',
                            currentBet: 100,
                            playerCards: [{}, {}, {}],
                        },
                    }],
                    rowCount: 1,
                };
            }
            throw new Error(`Unexpected SQL in test: ${sql}`);
        },
    };
    const controller = createBlackjackController({
        transaction: (callback) => callback(client),
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

    await controller.blackjackAction({
        authSession: { player: { id: 'player-1' } },
        body: {
            action: 'double',
            requestId: '4b9b2b9e-32d8-4cd7-8fa9-53d1c0184c56',
        },
    }, response, (error) => {
        throw error;
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, 'Недопустимый ход в блэкджеке.');
    assert.equal(queries.some((sql) => sql.startsWith('UPDATE players')), false);
    assert.equal(queries.some((sql) => sql.includes('INSERT INTO chip_transactions')), false);
});
