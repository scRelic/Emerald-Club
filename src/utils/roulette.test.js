import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getRouletteNumberColor,
    isValidRouletteBetKey,
    isValidRouletteChipAmount,
    settleRouletteBets,
} from './roulette.js'

test('maps European roulette colors including green zero', () => {
    assert.equal(getRouletteNumberColor(0), 'green')
    assert.equal(getRouletteNumberColor(1), 'red')
    assert.equal(getRouletteNumberColor(2), 'black')
    assert.throws(() => getRouletteNumberColor(37), RangeError)
})

test('settles overlapping bets using gross payouts and net results', () => {
    assert.deepEqual(settleRouletteBets({
        red: 100,
        '1-18': 100,
        num_1: 50,
    }, 1), {
        totalBet: 250,
        payout: 2200,
        netChange: 1950,
        outcome: 'win',
    })

    assert.deepEqual(settleRouletteBets({
        num_0: 100,
        even: 200,
    }, 0), {
        totalBet: 300,
        payout: 3600,
        netChange: 3300,
        outcome: 'win',
    })
})

test('recognizes a push and a net loss despite a partial payout', () => {
    assert.equal(settleRouletteBets({ red: 100, num_0: 100 }, 1).outcome, 'draw')
    assert.deepEqual(settleRouletteBets({ red: 50, num_1: 1000 }, 3), {
        totalBet: 1050,
        payout: 100,
        netChange: -950,
        outcome: 'loss',
    })
})

test('rejects invalid bet keys, amounts, and winning numbers', () => {
    assert.equal(isValidRouletteBetKey('num_36'), true)
    assert.equal(isValidRouletteBetKey('num_37'), false)
    assert.equal(isValidRouletteBetKey('num_01'), false)
    assert.throws(() => settleRouletteBets({ 'num_37': 100 }, 1), RangeError)
    assert.throws(() => settleRouletteBets({ red: -100 }, 1), RangeError)
    assert.throws(() => settleRouletteBets({ red: 100.5 }, 1), RangeError)
    assert.throws(() => settleRouletteBets({ red: 100 }, 37), RangeError)
})

test('allows every roulette chip denomination, including 5000', () => {
    assert.equal(isValidRouletteChipAmount(5000), true)
    assert.equal(isValidRouletteChipAmount(5001), false)
    assert.equal(isValidRouletteChipAmount(5000.5), false)
})
