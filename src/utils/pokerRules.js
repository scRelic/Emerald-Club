export function getPokerPositions(seatCount, dealerIndex) {
    if (!Number.isInteger(seatCount) || seatCount < 2) {
        throw new RangeError('A poker table must have at least two seats')
    }

    const dealer = ((dealerIndex % seatCount) + seatCount) % seatCount
    const smallBlind = seatCount === 2 ? dealer : (dealer + 1) % seatCount
    const bigBlind = (smallBlind + 1) % seatCount

    return {
        dealer,
        smallBlind,
        bigBlind,
        preflopFirst: seatCount === 2 ? smallBlind : (bigBlind + 1) % seatCount,
        postflopFirst: (dealer + 1) % seatCount,
    }
}

export function clockwiseSeatIds(seats, startIndex) {
    if (seats.length === 0) return []

    const start = ((startIndex % seats.length) + seats.length) % seats.length
    return Array.from({ length: seats.length }, (_, offset) => seats[(start + offset) % seats.length].id)
}

export function buildSidePots(seats) {
    const levels = [...new Set(seats.map(seat => seat.totalInvested).filter(amount => amount > 0))]
        .sort((a, b) => a - b)
    const pots = []
    const refunds = []
    let previousLevel = 0

    for (const level of levels) {
        const contributors = seats.filter(seat => seat.totalInvested >= level)
        const amount = (level - previousLevel) * contributors.length
        if (contributors.length === 1) {
            refunds.push({ id: contributors[0].id, amount })
            previousLevel = level
            continue
        }

        let eligibleIds = seats
            .filter(seat => !seat.folded && seat.totalInvested >= level)
            .map(seat => seat.id)

        if (eligibleIds.length === 0) {
            eligibleIds = seats.filter(seat => !seat.folded).map(seat => seat.id)
        }

        if (amount > 0 && eligibleIds.length > 0) {
            pots.push({ amount, eligibleIds })
        }

        previousLevel = level
    }

    return { pots, refunds }
}

export function splitPot(amount, winnerIds, clockwiseOrder) {
    if (amount <= 0 || winnerIds.length === 0) return []

    const winners = clockwiseOrder.filter(id => winnerIds.includes(id))
    if (winners.length === 0) {
        throw new RangeError('At least one pot winner must be seated at the table')
    }

    const share = Math.floor(amount / winners.length)
    const remainder = amount % winners.length

    return winners.map((id, index) => ({
        id,
        amount: share + (index < remainder ? 1 : 0),
    }))
}

export function getPokerCombinationStat(description) {
    if (typeof description !== 'string') return null
    if (description.includes('Royal Flush')) return 'royalFlushes'
    if (description.includes('Straight Flush')) return 'straightFlushes'
    if (description.includes('Four of a Kind')) return 'kare'
    if (description.includes('Flush')) return 'flushes'
    if (description.includes('Straight')) return 'straights'
    return null
}
