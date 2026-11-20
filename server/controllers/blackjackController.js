import { randomInt as secureRandomInt } from 'node:crypto';
import { withTransaction } from '../config/db.js';
import {
    applyBlackjackAction,
    getPublicBlackjackState,
    startBlackjackRound,
} from '../services/blackjackEngine.js';
import { ROULETTE_CHIP_AMOUNTS } from '../../src/utils/roulette.js';
import {
    finishRound,
    insertChipTransaction,
    requireBet,
    updateBalance,
} from './gameProgress.js';
import { createGameOperationRunner, httpError } from './gameOperation.js';

const finishBlackjackRound = (client, playerId, state) => finishRound(
    client,
    playerId,
    'blackjack',
    {
        bet: state.currentBet,
        payout: state.payout,
        outcome: state.outcome,
    },
    {
        symbol: '♠',
        label: (result) => result.outcome === 'blackjack'
            ? 'Натуральный 21 (3:2)'
            : state.message,
        stats: (result) => ({
            naturals_21: result.outcome === 'blackjack',
        }),
    },
);

export const createBlackjackController = ({
    transaction,
    randomInt = secureRandomInt,
} = {}) => {
    const runOperation = createGameOperationRunner({ transaction });

    const startBlackjack = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const bet = body.bet;
            requireBet(bet, ROULETTE_CHIP_AMOUNTS);
            if (Number(player.chips) < bet) throw httpError(409, 'Недостаточно фишек для этой ставки.');
            const existing = await client.query(
                `SELECT 1 FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'blackjack' FOR UPDATE`,
                [player.id],
            );
            if (existing.rowCount) throw httpError(409, 'Сначала завершите текущую раздачу.');

            const state = startBlackjackRound({ bet, randomInt });
            await updateBalance(client, player.id, -bet);
            await insertChipTransaction(client, player.id, -bet, 'game_bet');
            if (state.status === 'finished') {
                await finishBlackjackRound(client, player.id, state);
            } else {
                await client.query(
                    `INSERT INTO player_game_sessions (player_id, game, state)
                     VALUES ($1, 'blackjack', $2)`,
                    [player.id, state],
                );
            }
            return getPublicBlackjackState(state);
        },
    );

    const blackjackAction = (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const sessionResult = await client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'blackjack' FOR UPDATE`,
                [player.id],
            );
            if (!sessionResult.rowCount) throw httpError(404, 'Активная раздача не найдена.');

            const state = sessionResult.rows[0].state;
            const additionalBet = body.action === 'double' ? state.currentBet : 0;
            applyBlackjackAction(state, body.action, randomInt);

            if (additionalBet > 0) {
                if (Number(player.chips) < additionalBet) {
                    throw httpError(409, 'Недостаточно фишек для удвоения ставки.');
                }
                await updateBalance(client, player.id, -additionalBet);
                await insertChipTransaction(client, player.id, -additionalBet, 'game_bet');
            }

            if (state.status === 'finished') {
                await client.query(
                    `DELETE FROM player_game_sessions
                     WHERE player_id = $1 AND game = 'blackjack'`,
                    [player.id],
                );
                await finishBlackjackRound(client, player.id, state);
            } else {
                await client.query(
                    `UPDATE player_game_sessions
                     SET state = $2, updated_at = NOW()
                     WHERE player_id = $1 AND game = 'blackjack'`,
                    [player.id, state],
                );
            }
            return getPublicBlackjackState(state);
        },
    );

    const resumeBlackjack = async (req, res, next) => {
        try {
            const result = await withTransaction((client) => client.query(
                `SELECT state FROM player_game_sessions
                 WHERE player_id = $1 AND game = 'blackjack'`,
                [req.authSession.player.id],
            ));
            return res.json({
                session: result.rows[0] ? getPublicBlackjackState(result.rows[0].state) : null,
            });
        } catch (error) {
            return next(error);
        }
    };

    return { startBlackjack, blackjackAction, resumeBlackjack };
};
