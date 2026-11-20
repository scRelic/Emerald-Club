import { randomInt as secureRandomInt } from 'node:crypto';
import { playDiceRound, playFortuneRound, playRouletteRound } from '../services/gameRules.js';
import { ROULETTE_CHIP_AMOUNTS } from '../../src/utils/roulette.js';
import {
    insertChipTransaction,
    finishRound,
    requireBet,
    updateBalance,
} from './gameProgress.js';
import { createGameOperationRunner, httpError } from './gameOperation.js';

const SIMPLE_GAMES = {
    dice: {
        play: playDiceRound,
        symbol: '🎲',
        label: (result) => `Сумма ${result.total} — ставка на ${
            { low: 'меньше 7', high: 'больше 7', exact: 'ровно 7' }[result.prediction]
        }`,
        stats: (result) => ({ biggestWin: Math.max(0, result.netChange) }),
    },
    fortune: {
        play: playFortuneRound,
        symbol: '🎡',
        label: (result) => `Сектор ${result.segment.label}`,
        stats: (result) => ({ biggestWin: Math.max(0, result.netChange) }),
    },
    roulette: {
        play: playRouletteRound,
        symbol: '⚙️',
        label: (result) => `Выпало: ${result.winningNumber}`,
        stats: (result) => ({
            biggestWin: Math.max(0, result.netChange),
            zero_hits: result.winningNumber === 0 && result.payout > 0,
        }),
    },
};

export const createSimpleGamesController = ({
    transaction,
    randomInt = secureRandomInt,
} = {}) => {
    const runOperation = createGameOperationRunner({ transaction });
    const playSimpleGame = (game) => (req, res, next) => runOperation(
        req,
        res,
        next,
        async (client, player, body) => {
            const bet = game === 'roulette'
                ? Object.values(body.bets || {}).reduce((total, amount) => total + amount, 0)
                : body.bet;
            if (game !== 'roulette') requireBet(bet, ROULETTE_CHIP_AMOUNTS);
            if (Number(player.chips) < bet) throw httpError(409, 'Недостаточно фишек для этой ставки.');

            const gameResult = SIMPLE_GAMES[game].play({
                ...body,
                randomInt,
            });
            await updateBalance(client, player.id, -bet);
            await insertChipTransaction(client, player.id, -bet, 'game_bet');
            await finishRound(client, player.id, game, gameResult, SIMPLE_GAMES[game]);
            return gameResult;
        },
    );

    return {
        diceRound: playSimpleGame('dice'),
        fortuneRound: playSimpleGame('fortune'),
        rouletteRound: playSimpleGame('roulette'),
    };
};
