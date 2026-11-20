import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyPokerAction,
    createPokerSession,
    getPublicPokerState,
} from './pokerEngine.js';

const middleRandom = (minimum, maximum) => Math.floor((minimum + maximum - 1) / 2);

test('poker session is server-created and does not expose hidden opponent cards', () => {
    const state = createPokerSession({ tableId: 'classic', buyIn: 500 }, middleRandom);
    const publicState = getPublicPokerState(state);

    assert.equal(state.playerCards.length, 2);
    assert.equal(state.botCards.length, 2);
    assert.equal(publicState.bots[0].cards[0], null);
    assert.deepEqual(publicState.communityCards, []);
});

test('poker actions are checked by the server before advancing the board', () => {
    const state = createPokerSession({ tableId: 'classic', buyIn: 500 }, middleRandom);
    assert.equal(state.currentActorId, 'player');

    assert.throws(() => applyPokerAction(state, { action: 'raise', amount: 1 }, middleRandom), {
        status: 400,
    });

    applyPokerAction(state, { action: 'call' }, middleRandom);
    assert.equal(state.stage, 'flop');
    assert.equal(state.communityCards.length, 3);
    assert.equal(state.currentActorId, 'player');
});

test('folding settles the hand and produces a server-side loss record', () => {
    const state = createPokerSession({ tableId: 'classic', buyIn: 500 }, middleRandom);
    applyPokerAction(state, { action: 'fold' }, middleRandom);

    assert.equal(state.stage, 'showdown');
    assert.equal(state.resultType, 'loss');
    assert.equal(state.pendingRoundResult.outcome, 'loss');
    assert.equal(state.pendingRoundResult.bet, 50);
});

test('player can respond to an opponent all-in raise', () => {
    const state = createPokerSession({ tableId: 'classic', buyIn: 500 }, middleRandom);

    assert.equal(state.stage, 'preflop');
    assert.equal(state.currentActorId, 'player');

    state.botChips = 0;
    state.botRoundBet += 50;
    state.botTotalInvested += 50;
    state.currentBet += 50;
    state.pot += 50;

    applyPokerAction(state, { action: 'call' }, middleRandom);

    assert.equal(state.stage, 'showdown');
    assert.equal(state.pendingRoundResult.bet, 100);
    assert.ok(state.tableChips > 0);
});
