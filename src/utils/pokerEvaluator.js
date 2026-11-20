const RANK_ORDER = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

const HAND_NAMES = {
    9: 'Роял-флеш',
    8: 'Стрит-флеш',
    7: 'Каре',
    6: 'Фулл-хаус',
    5: 'Флеш',
    4: 'Стрит',
    3: 'Сет / Тройка',
    2: 'Две пары',
    1: 'Пара',
    0: 'Старшая карта',
}


function evaluate5Cards(cards) {
    const values = cards.map(c => RANK_ORDER[c.value]).sort((a, b) => b - a)
    const suits = cards.map(c => c.suit)

    const isFlush = suits.every(s => s === suits[0])

    
    const uniqueVals = [...new Set(values)]
    let isStraight = false
    let straightHigh = 0

    if (uniqueVals.length === 5) {
        if (uniqueVals[0] - uniqueVals[4] === 4) {
            isStraight = true
            straightHigh = uniqueVals[0]
        } else if (
            uniqueVals[0] === 14 &&
            uniqueVals[1] === 5 &&
            uniqueVals[2] === 4 &&
            uniqueVals[3] === 3 &&
            uniqueVals[4] === 2
        ) {
            isStraight = true
            straightHigh = 5 
        }
    }

    
    const counts = {}
    for (const v of values) {
        counts[v] = (counts[v] || 0) + 1
    }

    
    const groups = Object.entries(counts)
        .map(([val, count]) => ({ val: Number(val), count }))
        .sort((a, b) => b.count - a.count || b.val - a.val)

    const pattern = groups.map(g => g.count).join('')
    const tiebreakers = groups.map(g => g.val)

    let rank = 0
    if (isStraight && isFlush) {
        rank = straightHigh === 14 ? 9 : 8
        return { rank, tiebreakers: [straightHigh], name: HAND_NAMES[rank] }
    }
    if (pattern === '41') rank = 7
    else if (pattern === '32') rank = 6
    else if (isFlush) return { rank: 5, tiebreakers: values, name: HAND_NAMES[5] }
    else if (isStraight) return { rank: 4, tiebreakers: [straightHigh], name: HAND_NAMES[4] }
    else if (pattern === '311') rank = 3
    else if (pattern === '221') rank = 2
    else if (pattern === '2111') rank = 1

    return { rank, tiebreakers, name: HAND_NAMES[rank] }
}


export function compareEvaluations(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank
    const len = Math.max(a.tiebreakers.length, b.tiebreakers.length)
    for (let i = 0; i < len; i++) {
        const diff = (a.tiebreakers[i] || 0) - (b.tiebreakers[i] || 0)
        if (diff !== 0) return diff
    }
    return 0
}


export function evaluateBestHand(cards) {
    if (cards.length < 5) {
        
        const vals = cards.map(c => RANK_ORDER[c.value]).sort((a, b) => b - a)
        const isPair = vals.length === 2 && vals[0] === vals[1]
        return {
            rank: isPair ? 1 : 0,
            tiebreakers: vals,
            name: isPair ? 'Карманная пара' : 'Старшая карта',
        }
    }

    let best = null
    const n = cards.length

    for (let i = 0; i < n - 4; i++) {
        for (let j = i + 1; j < n - 3; j++) {
            for (let k = j + 1; k < n - 2; k++) {
                for (let l = k + 1; l < n - 1; l++) {
                    for (let m = l + 1; m < n; m++) {
                        const evalResult = evaluate5Cards([cards[i], cards[j], cards[k], cards[l], cards[m]])
                        if (!best || compareEvaluations(evalResult, best) > 0) {
                            best = evalResult
                        }
                    }
                }
            }
        }
    }

    return best
}