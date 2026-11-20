import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyBlackjackAction,
    getPublicBlackjackState,
    startBlackjackRound,
} from './blackjackEngine.js';

const firstAvailableCard = () => 0;

test('blackjack engine deals cards and keeps the hole card hidden in public state', () => {
    const state = startBlackjackRound({ bet: 100, randomInt: firstAvailableCard });
    const publicState = getPublicBlackjackState(state);

    assert.equal(state.playerCards.length, 2);
    assert.equal(publicState.dealerCards.length, 2);
    assert.equal(publicState.dealerCards[1].rank, '?');
    assert.notDeepEqual(publicState.dealerCards[1], state.dealerCards[1]);
    assert.equal(Object.prototype.hasOwnProperty.call(publicState, 'deck'), false);
});

test('blackjack engine accepts a legal hit and rejects actions after completion', () => {
    const state = startBlackjackRound({ bet: 100, randomInt: firstAvailableCard });
    assert.equal(state.status, 'playing');

    applyBlackjackAction(state, 'hit', firstAvailableCard);
    assert.equal(state.playerCards.length, 3);

    state.status = 'finished';
    assert.throws(() => applyBlackjackAction(state, 'stand', firstAvailableCard), {
        status: 409,
    });
});
