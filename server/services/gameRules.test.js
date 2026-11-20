import test from 'node:test';
import assert from 'node:assert/strict';
import {
    playDiceRound,
    playFortuneRound,
    playRouletteRound,
} from './gameRules.js';

const fixedRandom = (values) => {
    let index = 0;
    return () => values[index++];
};

test('dice payout is generated and calculated by the server rules', () => {
    const result = playDiceRound({
        bet: 100,
        prediction: 'exact',
        randomInt: fixedRandom([3, 4]),
    });

    assert.deepEqual(result.dice, [3, 4]);
    assert.equal(result.payout, 500);
    assert.equal(result.netChange, 400);
    assert.equal(result.outcome, 'win');
});

test('fortune wheel returns the server-selected segment and payout', () => {
    const result = playFortuneRound({
        bet: 100,
        randomInt: fixedRandom([4]),
    });

    assert.equal(result.segment.id, 'ten');
    assert.equal(result.payout, 1000);
    assert.equal(result.outcome, 'win');
});

test('roulette settles server-selected result and rejects malformed wagers', () => {
    const result = playRouletteRound({
        bets: { red: 100, num_0: 50 },
        randomInt: fixedRandom([1]),
    });

    assert.equal(result.winningNumber, 1);
    assert.equal(result.bet, 150);
    assert.equal(result.payout, 200);
    assert.equal(result.netChange, 50);
    assert.throws(
        () => playRouletteRound({ bets: { invalid: 500 }, randomInt: () => 1 }),
        /valid keys and positive integer amounts/,
    );
});
