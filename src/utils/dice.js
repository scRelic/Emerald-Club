const rollDie = (random) => {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError('Random value must be in the range [0, 1)')
    }
    return Math.floor(value * 6) + 1
}

export const rollDice = (random = Math.random) => [rollDie(random), rollDie(random)]

export const getDicePayoutMultiplier = (prediction, total) => {
    if (!Number.isInteger(total) || total < 2 || total > 12) return 0
    if (prediction === 'low' && total >= 2 && total <= 6) return 2
    if (prediction === 'high' && total >= 8 && total <= 12) return 2
    if (prediction === 'exact' && total === 7) return 5
    return 0
}
