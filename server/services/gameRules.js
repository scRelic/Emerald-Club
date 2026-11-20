import { getDicePayoutMultiplier } from '../../src/utils/dice.js';
import { fortuneWheelSegments } from '../../src/utils/fortuneWheel.js';
import {
    ROULETTE_CHIP_AMOUNTS,
    settleRouletteBets,
} from '../../src/utils/roulette.js';

const isAllowedBet = (bet) => Number.isSafeInteger(bet) && ROULETTE_CHIP_AMOUNTS.includes(bet);

const assertBet = (bet) => {
    if (!isAllowedBet(bet)) {
        const error = new Error('Ставка должна быть одним из доступных номиналов фишек.');
        error.status = 400;
        throw error;
    }
};

export const playDiceRound = ({ bet, prediction, randomInt }) => {
    assertBet(bet);
    if (!['low', 'high', 'exact'].includes(prediction)) {
        const error = new Error('Неизвестный прогноз для игры в кости.');
        error.status = 400;
        throw error;
    }

    const dice = [randomInt(1, 7), randomInt(1, 7)];
    const total = dice[0] + dice[1];
    const multiplier = getDicePayoutMultiplier(prediction, total);
    const payout = bet * multiplier;
    return {
        dice,
        total,
        bet,
        prediction,
        payout,
        netChange: payout - bet,
        outcome: multiplier > 0 ? 'win' : 'loss',
    };
};

export const playFortuneRound = ({ bet, randomInt }) => {
    assertBet(bet);
    const index = randomInt(0, fortuneWheelSegments.length);
    const segment = fortuneWheelSegments[index];
    if (!segment) {
        throw new RangeError('Random source returned an invalid fortune wheel segment.');
    }

    const payout = Math.round(bet * segment.multiplier);
    const outcome = payout > bet ? 'win' : payout === bet ? 'draw' : 'loss';
    return {
        segmentIndex: index,
        segment,
        bet,
        payout,
        netChange: payout - bet,
        outcome,
    };
};

export const playRouletteRound = ({ bets, randomInt }) => {
    if (!bets || typeof bets !== 'object' || Array.isArray(bets) || Object.keys(bets).length === 0) {
        const error = new Error('Сделайте хотя бы одну ставку.');
        error.status = 400;
        throw error;
    }
    if (Object.keys(bets).length > 40) {
        const error = new Error('Слишком много ставок за один раунд.');
        error.status = 400;
        throw error;
    }

    const winningNumber = randomInt(0, 37);
    const settlement = settleRouletteBets(bets, winningNumber);
    return { winningNumber, bet: settlement.totalBet, ...settlement };
};

export const rollBlackjackCard = (deck, randomInt) => {
    if (!Array.isArray(deck) || deck.length === 0) {
        const error = new Error('В колоде закончились карты.');
        error.status = 500;
        throw error;
    }
    const index = randomInt(0, deck.length);
    const [card] = deck.splice(index, 1);
    return card;
};

export const createBlackjackDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    return suits.flatMap((suit) => values.map((value) => ({
        suit,
        value,
        rank: value,
        englishSuit: { '♠': 'spades', '♣': 'clubs', '♥': 'hearts', '♦': 'diamonds' }[suit],
    })));
};

