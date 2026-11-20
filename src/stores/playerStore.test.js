import test from 'node:test'
import assert from 'node:assert/strict'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from './playerStore.js'
import { shopItems } from '../utils/data.js'

test('persists player progress and restores it when the store is recreated', async () => {
    const previousWindow = globalThis.window
    const values = new Map()
    let reloadCount = 0
    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: (key) => values.delete(key),
        },
        location: { reload: () => reloadCount++ },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        assert.equal(store.hasLocalProgress, false)
        store.setName('Dima')
        store.addChips(250)
        store.stats.poker.wins++
        store.stats.roulette.zeroHits++
        store.stats.roulette.biggestWin = 3600
        store.gameHistory.unshift({ game: 'Рулетка', payout: 3600 })
        await nextTick()

        assert.equal(store.hasLocalProgress, true)
        assert.equal(values.size, 1)
        const savedProgress = JSON.parse(values.values().next().value)
        assert.equal(Object.prototype.hasOwnProperty.call(savedProgress, 'name'), false)

        store.addChips(10000)
        for (const itemId of ['avatar-diamond', 'card-royal-gold', 'table-burgundy']) {
            const item = shopItems.find(({ id }) => id === itemId)
            assert.equal(store.buyOrEquipItem(item, true).ok, true)
        }
        await nextTick()

        setActivePinia(createPinia())
        const restoredStore = usePlayerStore()
        assert.equal(restoredStore.name, 'Player')
        assert.equal(restoredStore.chips, 5550)
        assert.equal(restoredStore.avatarId, 'diamond')
        assert.equal(restoredStore.equipped.avatars, 'avatar-diamond')
        assert.equal(restoredStore.activeCardBack, 'card-royal-gold')
        assert.equal(restoredStore.activeTableTheme, 'table-burgundy')
        assert.ok(restoredStore.ownedItems.includes('card-royal-gold'))
        assert.equal(restoredStore.stats.poker.wins, 1)
        assert.equal(restoredStore.stats.roulette.zeroHits, 1)
        assert.equal(restoredStore.stats.roulette.biggestWin, 3600)
        assert.deepEqual(restoredStore.claimedAchievementIds.sort(), [
            'high-roller',
            'poker-first-win',
            'roulette-zero',
        ])

        const balanceAfterRewards = restoredStore.chips
        restoredStore.stats.poker.wins++
        assert.equal(restoredStore.chips, balanceAfterRewards)

        const balanceBeforeReequip = restoredStore.chips
        assert.equal(
            restoredStore.buyOrEquipItem(shopItems.find(({ id }) => id === 'card-classic'), true).ok,
            true,
        )
        assert.equal(
            restoredStore.buyOrEquipItem(shopItems.find(({ id }) => id === 'card-royal-gold'), true).ok,
            true,
        )
        assert.equal(restoredStore.chips, balanceBeforeReequip)
        assert.equal(restoredStore.activeCardBack, 'card-royal-gold')
        await nextTick()

        setActivePinia(createPinia())
        const reequippedStore = usePlayerStore()
        assert.equal(reequippedStore.activeCardBack, 'card-royal-gold')
        assert.equal(reequippedStore.chips, balanceBeforeReequip)

        const [storageKey, serializedProgress] = values.entries().next().value
        const legacyProgress = JSON.parse(serializedProgress)
        legacyProgress.name = 'LegacyLocalName'
        legacyProgress.stats.roulette.biggestWin = 0
        values.set(storageKey, JSON.stringify(legacyProgress))
        setActivePinia(createPinia())
        const migratedStore = usePlayerStore()
        assert.equal(migratedStore.name, 'Player')
        assert.equal(migratedStore.stats.roulette.biggestWin, 3600)
        const migratedProgress = JSON.parse(values.get(storageKey))
        assert.equal(Object.prototype.hasOwnProperty.call(migratedProgress, 'name'), false)

        migratedStore.resetProgress()
        assert.equal(values.size, 0)
        assert.equal(reloadCount, 1)
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('prevents purchases and chip claims for unauthenticated players', () => {
    setActivePinia(createPinia())
    const store = usePlayerStore()
    const chipsBeforePurchase = store.chips
    const item = shopItems.find(({ category }) => category === 'chips')

    const result = store.buyOrEquipItem(item)

    assert.equal(result.ok, false)
    assert.equal(store.chips, chipsBeforePurchase)
    assert.match(result.message, /Войдите в аккаунт/)
})

test('hydrates profile state from the server without persisting the name locally', async () => {
    const previousWindow = globalThis.window
    const values = new Map()
    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: (key) => values.delete(key),
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        const state = store.getProgressSnapshot()
        state.name = 'TopTyns'
        state.level = 6
        state.xp = 320
        state.chips = 3800
        state.stats.blackjack.betsCount = 12
        state.ownedItems.push('card-royal-gold')
        state.equipped.cards = 'card-royal-gold'
        state.activeCardBack = 'card-royal-gold'
        state.gameHistory = [{
            id: '1',
            game: 'Блэкджек',
            symbol: '♠',
            bet: 100,
            payout: 200,
            netChange: 100,
            outcome: 'win',
            label: 'Победа',
            time: 'Сегодня, 12:00',
            playedAt: '2025-01-01T12:00:00.000Z',
        }]

        assert.equal(store.applyServerState(state), true)
        assert.equal(store.name, 'TopTyns')
        assert.equal(store.level, 6)
        assert.equal(store.xp, 320)
        assert.equal(store.chips, 3800)
        assert.equal(store.stats.blackjack.betsCount, 12)
        assert.equal(store.activeCardBack, 'card-royal-gold')
        assert.equal(store.gameHistory[0].id, '1')
        await nextTick()

        const savedProgress = JSON.parse(values.values().next().value)
        assert.equal(Object.prototype.hasOwnProperty.call(savedProgress, 'name'), false)
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('prevents local progress from being migrated to a different account', async () => {
    const previousWindow = globalThis.window
    const values = new Map()
    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: (key) => values.delete(key),
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        store.addChips(100)
        await nextTick()

        assert.equal(store.canMigrateProgressTo('account-a'), false)
        assert.equal(store.setProgressOwner('account-a'), true)
        assert.equal(store.canMigrateProgressTo('account-a'), true)
        assert.equal(store.canMigrateProgressTo('account-b'), false)

        store.resetProgress()
        assert.equal(values.size, 0)
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('daily bonus can be claimed once per 24 hours and its cooldown persists', async () => {
    const previousWindow = globalThis.window
    const previousNow = Date.now
    const values = new Map()
    const startingTime = 1_800_000_000_000
    const cooldownMs = 24 * 60 * 60 * 1000
    let now = startingTime
    Date.now = () => now
    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: (key) => values.delete(key),
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        assert.deepEqual(store.claimDailyBonus(), { ok: true, amount: 500 })
        assert.equal(store.chips, 5500)
        assert.deepEqual(store.claimDailyBonus(), { ok: false, remainingMs: cooldownMs })
        await nextTick()

        setActivePinia(createPinia())
        const restoredStore = usePlayerStore()
        assert.equal(restoredStore.chips, 5500)
        assert.equal(restoredStore.dailyBonusLastClaimedAt, startingTime)
        assert.deepEqual(restoredStore.claimDailyBonus(), { ok: false, remainingMs: cooldownMs })

        now += cooldownMs - 1
        assert.deepEqual(restoredStore.claimDailyBonus(), { ok: false, remainingMs: 1 })
        now++
        assert.deepEqual(restoredStore.claimDailyBonus(), { ok: true, amount: 500 })
        assert.equal(restoredStore.chips, 6000)
    } finally {
        Date.now = previousNow
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})


test('records dice bets in player statistics and game history', () => {
    const previousWindow = globalThis.window
    globalThis.window = {
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        store.recordDiceRound({ bet: 100, payout: 0, outcome: 'loss', total: 7, prediction: 'low' })
        store.recordDiceRound({ bet: 100, payout: 200, outcome: 'win', total: 5, prediction: 'low' })

        assert.equal(store.stats.dice.betsCount, 2)
        assert.equal(store.stats.dice.wins, 1)
        assert.equal(store.stats.dice.losses, 1)
        assert.equal(store.stats.dice.biggestWin, 100)
        assert.equal(store.totalGames, 2)
        assert.equal(store.winRate, 50)
        assert.equal(store.gameHistory[0].game, 'Кости')
        assert.equal(store.gameHistory[0].payout, 200)
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('records fortune wheel results, including partial payouts and draws', () => {
    const previousWindow = globalThis.window
    globalThis.window = {
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        store.recordFortuneRound({ bet: 100, payout: 0, outcome: 'loss', multiplier: 0 })
        store.recordFortuneRound({ bet: 100, payout: 100, outcome: 'draw', multiplier: 1 })
        store.recordFortuneRound({ bet: 100, payout: 300, outcome: 'win', multiplier: 3 })

        assert.equal(store.stats.fortune.betsCount, 3)
        assert.equal(store.stats.fortune.wins, 1)
        assert.equal(store.stats.fortune.losses, 1)
        assert.equal(store.stats.fortune.draws, 1)
        assert.equal(store.stats.fortune.biggestWin, 200)
        assert.equal(store.totalGames, 3)
        assert.equal(store.winRate, 33)
        assert.equal(store.gameHistory[0].game, 'Колесо фортуны')
        assert.equal(store.gameHistory[0].netChange, 200)
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('records blackjack gross payouts and outcomes correctly', () => {
    const previousWindow = globalThis.window
    globalThis.window = {
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        store.recordBlackjackRound('blackjack', 100)
        store.recordBlackjackRound('win', 100)
        store.recordBlackjackRound('draw', 100)
        store.recordBlackjackRound('loss', 100)

        assert.equal(store.stats.blackjack.betsCount, 4)
        assert.equal(store.stats.blackjack.wins, 2)
        assert.equal(store.stats.blackjack.draws, 1)
        assert.equal(store.stats.blackjack.losses, 1)
        assert.deepEqual(
            store.gameHistory.slice(0, 4).map(({ payout, netChange }) => [payout, netChange]),
            [[0, -100], [100, 0], [200, 100], [250, 150]],
        )
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})

test('grants new blackjack and dice achievements only once', () => {
    const previousWindow = globalThis.window
    globalThis.window = {
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        location: { reload: () => {} },
    }

    try {
        setActivePinia(createPinia())
        const store = usePlayerStore()
        const startingBalance = store.chips

        store.stats.blackjack.wins = 4
        store.stats.blackjack.wins++
        assert.equal(store.chips, startingBalance + 600)
        store.stats.blackjack.wins++
        assert.equal(store.chips, startingBalance + 600)

        store.stats.dice.wins = 5
        assert.equal(store.chips, startingBalance + 1350)
        assert.ok(store.claimedAchievementIds.includes('blackjack-five-wins'))
        assert.ok(store.claimedAchievementIds.includes('dice-five-wins'))
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window
        } else {
            globalThis.window = previousWindow
        }
    }
})
