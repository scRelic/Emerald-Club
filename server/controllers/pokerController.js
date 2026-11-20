import { randomInt as secureRandomInt } from 'node:crypto';
import { withTransaction } from '../config/db.js';
import {
    applyPokerAction,
    createPokerSession,
    getPublicPokerState,
    leavePokerTable,
    startPokerHand,
} from '../services/pokerEngine.js';
import {
    awardUnlockedAchievements,
    finishPokerRound,
    insertChipTransaction,
    updateBalance,
} from './gameProgress.js';
import { createGameOperationRunner, httpError } from './gameOperation.js';

export const createPokerController = ({
    transaction,
    randomInt = secureRandomInt,
} = {}) => {
    const runOperation = createGameOperationRunner({ transaction });

    const sitAtPokerTable = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const existing = await client.query(
                `SELECT 1 FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker' FOR UPDATE`,
                [player.id],
            );
            if (existing.rowCount) throw httpError(409, 'Вы уже сидите за покерным столом.');

            const state = createPokerSession({
                tableId: body.tableId,
                buyIn: body.buyIn,
            }, randomInt);
            if (Number(player.chips) < state.buyIn) {
                throw httpError(409, 'Недостаточно фишек для входа за этот стол.');
            }

            await updateBalance(client, player.id, -state.buyIn);
            await insertChipTransaction(client, player.id, -state.buyIn, 'game_bet');
            if (state.pendingRoundResult) {
                await finishPokerRound(client, player.id, state.pendingRoundResult);
                state.pendingRoundResult = null;
            }
            await client.query(
                `INSERT INTO player_game_sessions (player_id, game, state)
                 VALUES ($1, 'poker', $2)`,
                [player.id, state],
            );
            return getPublicPokerState(state);
        },
    );

    const pokerAction = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const sessionResult = await client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker' FOR UPDATE`,
                [player.id],
            );
            if (!sessionResult.rowCount) throw httpError(404, 'Покерный стол не найден.');

            const state = sessionResult.rows[0].state;
            applyPokerAction(state, body, randomInt);
            if (state.pendingRoundResult) {
                await finishPokerRound(client, player.id, state.pendingRoundResult);
                state.pendingRoundResult = null;
            }
            await client.query(
                `UPDATE player_game_sessions
                 SET state = $2, updated_at = NOW()
                 WHERE player_id = $1 AND game = 'poker'`,
                [player.id, state],
            );
            return getPublicPokerState(state);
        },
    );

    const pokerNextHand = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player) => {
            const sessionResult = await client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker' FOR UPDATE`,
                [player.id],
            );
            if (!sessionResult.rowCount) throw httpError(404, 'Покерный стол не найден.');

            const state = sessionResult.rows[0].state;
            if (state.stage !== 'showdown' && state.stage !== 'idle') {
                throw httpError(409, 'Сначала завершите текущую раздачу.');
            }
            startPokerHand(state, randomInt);
            if (state.pendingRoundResult) {
                await finishPokerRound(client, player.id, state.pendingRoundResult);
                state.pendingRoundResult = null;
            }
            await client.query(
                `UPDATE player_game_sessions
                 SET state = $2, updated_at = NOW()
                 WHERE player_id = $1 AND game = 'poker'`,
                [player.id, state],
            );
            return getPublicPokerState(state);
        },
    );

    const pokerLeaveTable = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player) => {
            const sessionResult = await client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker' FOR UPDATE`,
                [player.id],
            );
            if (!sessionResult.rowCount) throw httpError(404, 'Покерный стол не найден.');

            const state = sessionResult.rows[0].state;
            const cashOut = leavePokerTable(state, randomInt);
            if (state.pendingRoundResult) {
                await finishPokerRound(client, player.id, state.pendingRoundResult);
                state.pendingRoundResult = null;
            }
            if (cashOut > 0) {
                await updateBalance(client, player.id, cashOut);
                await insertChipTransaction(client, player.id, cashOut, 'game_payout');
            }
            await client.query(
                `DELETE FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker'`,
                [player.id],
            );
            await awardUnlockedAchievements(client, player.id);
            return { cashOut, session: null };
        },
    );

    const resumePokerTable = async (req, res, next) => {
        try {
            const result = await withTransaction((client) => client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'poker'`,
                [req.authSession.player.id],
            ));
            return res.json({
                session: result.rows[0] ? getPublicPokerState(result.rows[0].state) : null,
            });
        } catch (error) {
            return next(error);
        }
    };

    return {
        sitAtPokerTable,
        pokerAction,
        pokerNextHand,
        pokerLeaveTable,
        resumePokerTable,
    };
};
