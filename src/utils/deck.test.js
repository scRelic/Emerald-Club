import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateHandScore, createShoe } from './deck.js'

test('calculates blackjack hands with multiple aces and busts correctly', () => {
    assert.equal(calculateHandScore([{ value: 'A' }, { value: 'A' }, { value: '9' }]), 21)
    assert.equal(calculateHandScore([{ value: 'A' }, { value: 'A' }, { value: '9' }, { value: '2' }]), 13)
    assert.equal(calculateHandScore([{ value: 'K' }, { value: 'Q' }, { value: '5' }]), 25)
})

test('creates the expected number of cards for a shoe', () => {
    assert.equal(createShoe(1).length, 52)
    assert.equal(createShoe(6).length, 312)
})
