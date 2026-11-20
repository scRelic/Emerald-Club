const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']


const SUIT_MAP = {
    '♠': 'spades',
    '♣': 'clubs',
    '♥': 'hearts',
    '♦': 'diamonds'
}

export function createShoe(decksCount = 6) {
    const shoe = []

    for (let d = 0; d < decksCount; d++) {
        for (const suit of SUITS) {
            for (const value of VALUES) {
                shoe.push({
                    suit,                       
                    value,                      
                    rank: value,                
                    englishSuit: SUIT_MAP[suit] 
                })
            }
        }
    }

    
    for (let i = shoe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shoe[i], shoe[j]] = [shoe[j], shoe[i]]
    }

    return shoe
}

export function calculateHandScore(cards) {
    let score = 0
    let aces = 0

    for (const card of cards) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10
        } else if (card.value === 'A') {
            score += 11
            aces++
        } else {
            score += Number(card.value)
        }
    }

    while (score > 21 && aces > 0) {
        score -= 10
        aces--
    }

    return score
}