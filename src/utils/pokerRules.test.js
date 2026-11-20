import test from 'node:test'
import assert from 'node:assert/strict'
import {
    buildSidePots,
    getPokerCombinationStat,
    getPokerPositions,
    splitPot,
} from './pokerRules.js'

test('heads-up positions put the dealer in the small blind and first to act preflop', () => {
    assert.deepEqual(getPokerPositions(2, 1), {
        dealer: 1,
        smallBlind: 1,
        bigBlind: 0,
        preflopFirst: 1,
        postflopFirst: 0,
    })
})

test('multiway positions start preflop after the big blind and postflop after the dealer', () => {
    assert.deepEqual(getPokerPositions(5, 2), {
        dealer: 2,
        smallBlind: 3,
        bigBlind: 4,
        preflopFirst: 0,
        postflopFirst: 3,
    })
})

test('side pots include folded contributions but exclude folded players from eligibility', () => {
    const result = buildSidePots([
        { id: 'short', totalInvested: 100, folded: false },
        { id: 'deep', totalInvested: 300, folded: false },
        { id: 'folded', totalInvested: 200, folded: true },
    ])

    assert.deepEqual(result, {
        pots: [
            { amount: 300, eligibleIds: ['short', 'deep'] },
            { amount: 200, eligibleIds: ['deep'] },
        ],
        refunds: [{ id: 'deep', amount: 100 }],
    })
})

test('returns unmatched contributions instead of awarding them as a side pot', () => {
    assert.deepEqual(buildSidePots([
        { id: 'winner', totalInvested: 100, folded: false },
        { id: 'raiser', totalInvested: 300, folded: true },
    ]), {
        pots: [{ amount: 200, eligibleIds: ['winner'] }],
        refunds: [{ id: 'raiser', amount: 200 }],
    })
})

test('split pots award each odd chip clockwise from the button', () => {
    assert.deepEqual(
        splitPot(11, ['a', 'b', 'c'], ['c', 'a', 'b']),
        [
            { id: 'c', amount: 4 },
            { id: 'a', amount: 4 },
            { id: 'b', amount: 3 },
        ],
    )
})

test('does not silently lose a pot when winner IDs do not match table seats', () => {
    assert.throws(() => splitPot(100, ['missing'], ['player']), RangeError)
})

test('classifies poker combinations without counting straight flushes twice', () => {
    assert.equal(getPokerCombinationStat('Royal Flush, A-high'), 'royalFlushes')
    assert.equal(getPokerCombinationStat('Straight Flush, 9-high'), 'straightFlushes')
    assert.equal(getPokerCombinationStat('Four of a Kind, Aces'), 'kare')
    assert.equal(getPokerCombinationStat('Flush, K-high'), 'flushes')
    assert.equal(getPokerCombinationStat('Straight, 9-high'), 'straights')
    assert.equal(getPokerCombinationStat('Full House, Kings over Nines'), null)
    assert.equal(getPokerCombinationStat(undefined), null)
})
