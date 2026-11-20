import { withTransaction } from '../config/db.js';
import { readProgress } from './playerController.js';

const requestIdIsValid = (requestId) => (
    typeof requestId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)
);

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const createGameOperationRunner = ({ transaction = withTransaction } = {}) => (
    async (req, res, next, action) => {
        const playerId = req.authSession?.player?.id;
        const requestId = req.body?.requestId;
        if (!requestIdIsValid(requestId)) {
            return res.status(400).json({ message: 'Некорректный идентификатор операции.' });
        }

        try {
            const response = await transaction(async (client) => {
                const playerResult = await client.query(
                    'SELECT id, chips, daily_bonus_last_claimed_at FROM players WHERE id = $1 FOR UPDATE',
                    [playerId],
                );
                const player = playerResult.rows[0];
                if (!player) throw httpError(404, 'Профиль игрока не найден.');

                const duplicate = await client.query(
                    `SELECT response FROM player_operation_requests
                     WHERE player_id = $1 AND request_id = $2`,
                    [playerId, requestId],
                );
                if (duplicate.rows[0]) {
                    return {
                        ...duplicate.rows[0].response,
                        playerState: await readProgress(client, playerId),
                    };
                }

                const result = await action(client, player, req.body);
                const payload = {
                    result,
                    playerState: await readProgress(client, playerId),
                };
                await client.query(
                    `INSERT INTO player_operation_requests (player_id, request_id, response)
                     VALUES ($1, $2, $3)`,
                    [playerId, requestId, payload],
                );
                return payload;
            });
            return res.json(response);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            return next(error);
        }
    }
);
