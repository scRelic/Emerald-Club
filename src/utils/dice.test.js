import test from 'node:test'
import assert from 'node:assert/strict'
import { getDicePayoutMultiplier, rollDice } from './dice.js'

test('rolls two six-sided dice within their valid range', () => {
    const values = [0, 0.999]
    assert.deepEqual(rollDice(() => values.shift()), [1, 6])
    assert.throws(() => rollDice(() => 1), RangeError)
    assert.throws(() => rollDice(() => Number.NaN), RangeError)
})

test('pays two times for low and high totals and five times for an exact seven', () => {
    assert.equal(getDicePayoutMultiplier('low', 6), 2)
    assert.equal(getDicePayoutMultiplier('low', 7), 0)
    assert.equal(getDicePayoutMultiplier('high', 8), 2)
    assert.equal(getDicePayoutMultiplier('high', 7), 0)
    assert.equal(getDicePayoutMultiplier('exact', 7), 5)
    assert.equal(getDicePayoutMultiplier('exact', 6), 0)
    assert.equal(getDicePayoutMultiplier('low', 2.5), 0)
    assert.equal(getDicePayoutMultiplier('high', 13), 0)
})
