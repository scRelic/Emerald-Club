import { calculateHandScore } from '../../src/utils/deck.js';
import {
    createBlackjackDeck,
    rollBlackjackCard,
} from './gameRules.js';

const finish = (state, outcome, payout, message) => {
    state.status = 'finished';
    state.outcome = outcome;
    state.payout = payout;
    state.message = message;
    return state;
};

const playDealerTurn = (state, randomInt) => {
    while (calculateHandScore(state.dealerCards) < 17) {
        state.dealerCards.push(rollBlackjackCard(state.deck, randomInt));
    }

    const playerScore = calculateHandScore(state.playerCards);
    const dealerScore = calculateHandScore(state.dealerCards);
    if (dealerScore > 21 || playerScore > dealerScore) {
        return finish(state, 'win', state.currentBet * 2, `Победа! ${playerScore} против ${dealerScore}`);
    }
    if (playerScore === dealerScore) {
        return finish(state, 'draw', state.currentBet, `Ничья (Push) — по ${playerScore} очков`);
    }
    return finish(state, 'loss', 0, `Дилер выиграл: ${dealerScore} против ${playerScore}`);
};

export const startBlackjackRound = ({ bet, randomInt }) => {
    const state = {
        deck: createBlackjackDeck(),
        playerCards: [],
        dealerCards: [],
        bet,
        currentBet: bet,
        status: 'playing',
        outcome: null,
        payout: 0,
        message: '',
    };

    state.playerCards.push(rollBlackjackCard(state.deck, randomInt));
    state.dealerCards.push(rollBlackjackCard(state.deck, randomInt));
    state.playerCards.push(rollBlackjackCard(state.deck, randomInt));
    state.dealerCards.push(rollBlackjackCard(state.deck, randomInt));

    const playerScore = calculateHandScore(state.playerCards);
    const dealerScore = calculateHandScore(state.dealerCards);
    if (playerScore === 21 && dealerScore === 21) {
        return finish(state, 'draw', bet, 'Ничья — у обоих натуральный Блэкджек!');
    }
    if (playerScore === 21) {
        return finish(state, 'blackjack', Math.round(bet * 2.5), 'Натуральный Блэкджек! Выплата 3:2');
    }
    if (dealerScore === 21) {
        return finish(state, 'loss', 0, 'У дилера натуральный Блэкджек');
    }
    return state;
};

export const applyBlackjackAction = (state, action, randomInt) => {
    if (!state || state.status !== 'playing') {
        const error = new Error('В этой раздаче больше нельзя сделать ход.');
        error.status = 409;
        throw error;
    }

    if (action === 'hit') {
        state.playerCards.push(rollBlackjackCard(state.deck, randomInt));
        const score = calculateHandScore(state.playerCards);
        if (score > 21) return finish(state, 'loss', 0, 'Перебор! Вы проиграли');
        if (score === 21) return playDealerTurn(state, randomInt);
        return state;
    }
    if (action === 'stand') return playDealerTurn(state, randomInt);
    if (action === 'double' && state.playerCards.length === 2) {
        state.currentBet *= 2;
        state.playerCards.push(rollBlackjackCard(state.deck, randomInt));
        if (calculateHandScore(state.playerCards) > 21) {
            return finish(state, 'loss', 0, 'Перебор после удвоения!');
        }
        return playDealerTurn(state, randomInt);
    }

    const error = new Error('Недопустимый ход в блэкджеке.');
    error.status = 400;
    throw error;
};

export const getPublicBlackjackState = (state) => ({
    playerCards: state.playerCards,
    dealerCards: state.status === 'playing'
        ? [state.dealerCards[0], { rank: '?', suit: '?', value: '?' }]
        : state.dealerCards,
    currentBet: state.currentBet,
    status: state.status,
    outcome: state.outcome,
    payout: state.payout,
    message: state.message,
});
