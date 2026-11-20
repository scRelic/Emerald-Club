const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const EVEN_MONEY_BETS = new Set(['red', 'black', 'even', 'odd', '1-18', '19-36'])
const COLUMN_BETS = new Set(['col_1', 'col_2', 'col_3'])
export const ROULETTE_CHIP_AMOUNTS = [50, 100, 250, 500, 1000, 5000]

export const isValidRouletteChipAmount = (amount) => (
    Number.isSafeInteger(amount) && ROULETTE_CHIP_AMOUNTS.includes(amount)
)

export const isValidRouletteBetKey = (key) => {
    if (EVEN_MONEY_BETS.has(key) || COLUMN_BETS.has(key)) return true
    if (typeof key !== 'string' || !/^num_(0|[1-9]\d?)$/.test(key)) return false

    const number = Number(key.slice(4))
    return number >= 0 && number <= 36
}

export const getRouletteNumberColor = (number) => {
    if (!Number.isInteger(number) || number < 0 || number > 36) {
        throw new RangeError('Roulette number must be an integer from 0 to 36')
    }

    if (number === 0) return 'green'
    return RED_NUMBERS.has(number) ? 'red' : 'black'
}

const getPayoutMultiplier = (betKey, winningNumber) => {
    if (betKey.startsWith('num_')) {
        return Number(betKey.slice(4)) === winningNumber ? 36 : 0
    }

    const color = getRouletteNumberColor(winningNumber)
    if (betKey === 'red' && color === 'red') return 2
    if (betKey === 'black' && color === 'black') return 2
    if (betKey === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) return 2
    if (betKey === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) return 2
    if (betKey === '1-18' && winningNumber >= 1 && winningNumber <= 18) return 2
    if (betKey === '19-36' && winningNumber >= 19 && winningNumber <= 36) return 2
    if (betKey === 'col_1' && winningNumber !== 0 && winningNumber % 3 === 1) return 3
    if (betKey === 'col_2' && winningNumber !== 0 && winningNumber % 3 === 2) return 3
    if (betKey === 'col_3' && winningNumber !== 0 && winningNumber % 3 === 0) return 3
    return 0
}

export const settleRouletteBets = (bets, winningNumber) => {
    getRouletteNumberColor(winningNumber)
    if (!bets || typeof bets !== 'object' || Array.isArray(bets)) {
        throw new TypeError('Roulette bets must be an object')
    }

    let totalBet = 0
    let payout = 0
    for (const [betKey, amount] of Object.entries(bets)) {
        if (!isValidRouletteBetKey(betKey) || !Number.isSafeInteger(amount) || amount <= 0) {
            throw new RangeError('Roulette bets must use valid keys and positive integer amounts')
        }

        totalBet += amount
        payout += amount * getPayoutMultiplier(betKey, winningNumber)
        if (!Number.isSafeInteger(totalBet) || !Number.isSafeInteger(payout)) {
            throw new RangeError('Roulette payout exceeds the supported chip range')
        }
    }

    const netChange = payout - totalBet
    return {
        totalBet,
        payout,
        netChange,
        outcome: totalBet === 0 ? null : netChange > 0 ? 'win' : netChange === 0 ? 'draw' : 'loss',
    }
}
