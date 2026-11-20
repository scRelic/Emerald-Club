import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { achievementDefinitions } from '../utils/achievements.js'

const STORAGE_KEY = 'emerald-club-player-progress'
const PROGRESS_OWNER_KEY = 'emerald-club-player-progress-owner'
const DAILY_BONUS_CHIPS = 500
const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000
const DEFAULT_OWNED_ITEMS = ['card-classic', 'table-emerald', 'avatar-spade']

const createDefaultStats = () => ({
    blackjack: { betsCount: 0, wins: 0, losses: 0, draws: 0, naturals21: 0 },
    poker: {
        betsCount: 0,
        wins: 0,
        losses: 0,
        straights: 0,
        flushes: 0,
        straightFlushes: 0,
        kare: 0,
        royalFlushes: 0,
    },
    roulette: { betsCount: 0, wins: 0, losses: 0, zeroHits: 0, biggestWin: 0 },
    dice: { betsCount: 0, wins: 0, losses: 0, biggestWin: 0 },
    fortune: { betsCount: 0, wins: 0, losses: 0, draws: 0, biggestWin: 0 },
})

const createDefaultEquipped = () => ({
    cards: 'card-classic',
    tables: 'table-emerald',
    avatars: 'avatar-spade',
})

export const usePlayerStore = defineStore('player', () => {

    const name = ref('Player')
    const hasLocalProgress = ref(false)
    const level = ref(1)
    const xp = ref(0)
    const chips = ref(5000)
    const avatarId = ref('spade')
    const dailyBonusLastClaimedAt = ref(0)
    let skipProgressPersistence = false

    const activeCardBack = ref('card-classic')
    const activeTableTheme = ref('table-emerald')
    const claimedAchievementIds = ref([])

    const stats = ref(createDefaultStats())

    const ownedItems = ref([...DEFAULT_OWNED_ITEMS])

    const equipped = ref(createDefaultEquipped())

    const nextLevelXp = computed(() => level.value * 100)
    const dailyBonusReadyAt = computed(() =>
        dailyBonusLastClaimedAt.value + DAILY_BONUS_COOLDOWN_MS,
    )

    const xpPercentage = computed(() => {
        if (!nextLevelXp.value) return 0
        return Math.min(100, Math.round((xp.value / nextLevelXp.value) * 100))
    })

    const totalGames = computed(() =>
        stats.value.blackjack.betsCount +
        stats.value.poker.betsCount +
        stats.value.roulette.betsCount +
        stats.value.dice.betsCount +
        stats.value.fortune.betsCount
    )

    const draws = computed(() => stats.value.blackjack.draws)
    const getAchievementProgressContext = () => ({
        stats: stats.value,
        chips: chips.value,
        totalGames: totalGames.value,
    })
    const achievements = computed(() =>
        achievementDefinitions.map((achievement) => {
            const rawProgress = achievement.progress(getAchievementProgressContext())
            const progress = Number.isFinite(rawProgress) ? Math.max(0, rawProgress) : 0
            const rewarded = claimedAchievementIds.value.includes(achievement.id)

            return {
                ...achievement,
                progress: rewarded ? achievement.target : Math.min(progress, achievement.target),
                unlocked: rewarded || progress >= achievement.target,
                rewarded,
            }
        }),
    )

    const gameHistory = ref([])

    const restoreProgress = () => {
        if (typeof window === 'undefined') return

        let savedProgress
        try {
            const serializedProgress = window.localStorage.getItem(STORAGE_KEY)
            if (!serializedProgress) return
            savedProgress = JSON.parse(serializedProgress)
        } catch (error) {
            console.error('Не удалось загрузить сохранённый прогресс:', error)
            return
        }

        if (!savedProgress || typeof savedProgress !== 'object' || Array.isArray(savedProgress)) return
        hasLocalProgress.value = true

        if (Object.prototype.hasOwnProperty.call(savedProgress, 'name')) {
            const progressWithoutName = { ...savedProgress }
            delete progressWithoutName.name

            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressWithoutName))
            } catch (error) {
                console.error('Не удалось удалить имя из локального прогресса:', error)
            }
        }

        if (Number.isFinite(savedProgress.level) && savedProgress.level >= 1) level.value = savedProgress.level
        if (Number.isFinite(savedProgress.xp) && savedProgress.xp >= 0) xp.value = savedProgress.xp
        if (Number.isFinite(savedProgress.chips) && savedProgress.chips >= 0) chips.value = savedProgress.chips
        if (Number.isFinite(savedProgress.dailyBonusLastClaimedAt) && savedProgress.dailyBonusLastClaimedAt >= 0) {
            dailyBonusLastClaimedAt.value = Math.min(savedProgress.dailyBonusLastClaimedAt, Date.now())
        }
        if (typeof savedProgress.avatarId === 'string') avatarId.value = savedProgress.avatarId
        if (typeof savedProgress.activeCardBack === 'string') activeCardBack.value = savedProgress.activeCardBack
        if (typeof savedProgress.activeTableTheme === 'string') activeTableTheme.value = savedProgress.activeTableTheme
        if (Array.isArray(savedProgress.claimedAchievementIds)) {
            claimedAchievementIds.value = savedProgress.claimedAchievementIds.filter((id) =>
                achievementDefinitions.some((achievement) => achievement.id === id),
            )
        }

        if (savedProgress.stats && typeof savedProgress.stats === 'object') {
            Object.entries(stats.value).forEach(([game, defaultStats]) => {
                const savedStats = savedProgress.stats[game]
                if (!savedStats || typeof savedStats !== 'object') return

                Object.keys(defaultStats).forEach((stat) => {
                    if (Number.isFinite(savedStats[stat]) && savedStats[stat] >= 0) {
                        defaultStats[stat] = savedStats[stat]
                    }
                })
            })
        }

        if (Array.isArray(savedProgress.ownedItems)) {
            ownedItems.value = savedProgress.ownedItems.filter((item) => typeof item === 'string')
        }
        if (savedProgress.equipped && typeof savedProgress.equipped === 'object') {
            Object.keys(equipped.value).forEach((category) => {
                const itemId = savedProgress.equipped[category]
                if (typeof itemId === 'string' && ownedItems.value.includes(itemId)) {
                    equipped.value[category] = itemId
                }
            })
        }

        if (ownedItems.value.includes(equipped.value.avatars)) {
            avatarId.value = equipped.value.avatars.replace('avatar-', '')
        }
        if (ownedItems.value.includes(equipped.value.cards)) {
            activeCardBack.value = equipped.value.cards
        }
        if (ownedItems.value.includes(equipped.value.tables)) {
            activeTableTheme.value = equipped.value.tables
        }
        if (Array.isArray(savedProgress.gameHistory)) {
            gameHistory.value = savedProgress.gameHistory
                .filter((entry) => entry && typeof entry === 'object' && typeof entry.game === 'string')
                .slice(0, 30)

            const biggestRecordedRouletteWin = gameHistory.value.reduce((biggestWin, entry) => {
                if (entry.game !== 'Рулетка' || !Number.isFinite(entry.payout)) return biggestWin
                return Math.max(biggestWin, entry.payout)
            }, 0)
            stats.value.roulette.biggestWin = Math.max(
                stats.value.roulette.biggestWin,
                biggestRecordedRouletteWin,
            )
        }
    }

    restoreProgress()

    const awardUnlockedAchievements = () => {
        const progressContext = getAchievementProgressContext()

        achievementDefinitions.forEach((achievement) => {
            if (
                achievement.progress(progressContext) >= achievement.target &&
                !claimedAchievementIds.value.includes(achievement.id)
            ) {
                claimedAchievementIds.value.push(achievement.id)
                addChips(achievement.reward)
            }
        })
    }

    const winRate = computed(() => {
        if (totalGames.value === 0) return 0

        const totalWins =
            stats.value.blackjack.wins +
            stats.value.poker.wins +
            stats.value.roulette.wins +
            stats.value.dice.wins +
            stats.value.fortune.wins

        return Math.round((totalWins / totalGames.value) * 100)
    })

    const setName = (newName) => {
        const trimmed = newName.trim()
        if (trimmed) name.value = trimmed
    }

    const getProgressSnapshot = () => ({
        name: name.value,
        level: level.value,
        xp: xp.value,
        chips: chips.value,
        dailyBonusLastClaimedAt: dailyBonusLastClaimedAt.value,
        avatarId: avatarId.value,
        activeCardBack: activeCardBack.value,
        activeTableTheme: activeTableTheme.value,
        stats: JSON.parse(JSON.stringify(stats.value)),
        ownedItems: [...ownedItems.value],
        equipped: { ...equipped.value },
        claimedAchievementIds: [...claimedAchievementIds.value],
        gameHistory: JSON.parse(JSON.stringify(gameHistory.value)),
    })

    const canMigrateProgressTo = (userId) => {
        if (!hasLocalProgress.value || typeof userId !== 'string' || !userId) return false
        if (typeof window === 'undefined') return false

        try {
            const ownerId = window.localStorage.getItem(PROGRESS_OWNER_KEY)
            return ownerId === userId
        } catch (error) {
            console.error('Не удалось проверить владельца локального прогресса:', error)
            return false
        }
    }

    const setProgressOwner = (userId) => {
        if (typeof userId !== 'string' || !userId || typeof window === 'undefined') return false

        try {
            window.localStorage.setItem(PROGRESS_OWNER_KEY, userId)
            return true
        } catch (error) {
            console.error('Не удалось сохранить владельца локального прогресса:', error)
            return false
        }
    }

    const applyServerState = (state) => {
        if (!state || typeof state !== 'object') return false

        if (typeof state.name === 'string') name.value = state.name
        if (Number.isFinite(state.level) && state.level >= 1) level.value = state.level
        if (Number.isFinite(state.xp) && state.xp >= 0) xp.value = state.xp
        dailyBonusLastClaimedAt.value = Number.isFinite(state.dailyBonusLastClaimedAt)
            ? state.dailyBonusLastClaimedAt
            : 0

        if (Array.isArray(state.claimedAchievementIds)) {
            claimedAchievementIds.value = state.claimedAchievementIds.filter((id) =>
                achievementDefinitions.some((achievement) => achievement.id === id),
            )
        }

        if (state.stats && typeof state.stats === 'object') {
            Object.keys(stats.value).forEach((game) => {
                if (!state.stats[game] || typeof state.stats[game] !== 'object') return
                Object.keys(stats.value[game]).forEach((field) => {
                    if (Number.isFinite(state.stats[game][field]) && state.stats[game][field] >= 0) {
                        stats.value[game][field] = state.stats[game][field]
                    }
                })
            })
        }
        if (Number.isFinite(state.chips) && state.chips >= 0) chips.value = state.chips

        if (Array.isArray(state.ownedItems)) {
            ownedItems.value = state.ownedItems.filter((item) => typeof item === 'string')
        }
        if (state.equipped && typeof state.equipped === 'object') {
            Object.keys(equipped.value).forEach((category) => {
                const itemId = state.equipped[category]
                if (typeof itemId === 'string' && ownedItems.value.includes(itemId)) {
                    equipped.value[category] = itemId
                }
            })
        }
        avatarId.value = equipped.value.avatars.replace('avatar-', '')
        activeCardBack.value = equipped.value.cards
        activeTableTheme.value = equipped.value.tables
        if (Array.isArray(state.gameHistory)) {
            gameHistory.value = state.gameHistory
                .filter((entry) => entry && typeof entry === 'object' && typeof entry.game === 'string')
                .slice(0, 30)
        }

        return true
    }

    const setAvatar = (id) => {
        const itemId = id.startsWith('avatar-') ? id : `avatar-${id}`
        if (!ownedItems.value.includes(itemId)) return false

        equipped.value.avatars = itemId
        avatarId.value = itemId.replace('avatar-', '')
        return true
    }

    const addChips = (amount = 500) => {
        chips.value += amount
    }

    const claimDailyBonus = () => {
        const remainingMs = dailyBonusReadyAt.value - Date.now()
        if (remainingMs > 0) return { ok: false, remainingMs }

        addChips(DAILY_BONUS_CHIPS)
        dailyBonusLastClaimedAt.value = Date.now()
        return { ok: true, amount: DAILY_BONUS_CHIPS }
    }

    watch(
        () => [
            chips.value,
            totalGames.value,
            ...Object.values(stats.value).flatMap((gameStats) => Object.values(gameStats)),
        ],
        awardUnlockedAchievements,
        { immediate: true, flush: 'sync' },
    )

    const spendChips = (amount) => {
        if (chips.value < amount) return false
        chips.value -= amount
        return true
    }

    const addXp = (amount) => {
        xp.value += amount
        while (xp.value >= nextLevelXp.value) {
            xp.value -= nextLevelXp.value
            level.value++
        }
    }

    
    
    const recordBlackjackRound = (result, betAmount = 100) => {
        const bj = stats.value.blackjack
        bj.betsCount++

        if (result === 'blackjack') {
            const payout = Math.round(betAmount * 2.5)
            bj.wins++
            bj.naturals21++
            addChips(payout)
            addXp(60)
            addHistoryEntry({
                game: 'Блэкджек',
                symbol: '♠',
                bet: betAmount,
                payout,
                netChange: payout - betAmount,
                outcome: 'blackjack',
                label: 'Натуральный 21 (3:2)',
            })
        } else if (result === 'win') {
            const payout = betAmount * 2
            bj.wins++
            addChips(payout)
            addXp(35)
            addHistoryEntry({
                game: 'Блэкджек',
                symbol: '♠',
                bet: betAmount,
                payout,
                netChange: betAmount,
                outcome: 'win',
                label: 'Победа над дилером',
            })
        } else if (result === 'draw') {
            bj.draws++
            addChips(betAmount)
            addXp(15)
            addHistoryEntry({
                game: 'Блэкджек',
                symbol: '♠',
                bet: betAmount,
                payout: betAmount,
                netChange: 0,
                outcome: 'draw',
                label: 'Ничья (Push)',
            })
        } else if (result === 'loss') {
            bj.losses++
            addXp(10)
            addHistoryEntry({
                game: 'Блэкджек',
                symbol: '♠',
                bet: betAmount,
                payout: 0,
                netChange: -betAmount,
                outcome: 'loss',
                label: 'Поражение',
            })
        }
    }

    
    const recordGameResult = ({ game, symbol, bet, payout, outcome, label }) => {
        
        if (stats && stats[game]) {
            stats[game].betsCount++
            if (outcome === 'win') stats[game].wins++
            else if (outcome === 'loss') stats[game].losses++
        }

        
        addXp(outcome === 'win' ? 50 : outcome === 'draw' ? 20 : 10)

        
        if (gameHistory) {
            const now = new Date()
            const timeStr = `Сегодня, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
            gameHistory.unshift({
                id: Date.now(),
                game,
                symbol: symbol || '🎰',
                bet,
                payout,
                netChange: payout - bet,
                outcome,
                label,
                time: timeStr,
            })
            if (gameHistory.length > 30) gameHistory.pop()
        }
    }

    const recordDiceRound = ({ bet, payout, outcome, total, prediction }) => {
        const dice = stats.value.dice
        dice.betsCount++

        if (outcome === 'win') {
            dice.wins++
            dice.biggestWin = Math.max(dice.biggestWin, payout - bet)
        } else {
            dice.losses++
        }

        addXp(outcome === 'win' ? 35 : 10)
        const predictionLabel = {
            low: 'меньше 7',
            high: 'больше 7',
            exact: 'ровно 7',
        }[prediction] || prediction
        addHistoryEntry({
            game: 'Кости',
            symbol: '🎲',
            bet,
            payout,
            netChange: payout - bet,
            outcome,
            label: `Сумма ${total} — ставка на ${predictionLabel}`,
        })
    }

    const recordFortuneRound = ({ bet, payout, outcome, multiplier }) => {
        const fortune = stats.value.fortune
        fortune.betsCount++

        if (outcome === 'win') {
            fortune.wins++
            fortune.biggestWin = Math.max(fortune.biggestWin, payout - bet)
        } else if (outcome === 'draw') {
            fortune.draws++
        } else {
            fortune.losses++
        }

        addXp(outcome === 'win' ? 35 : outcome === 'draw' ? 15 : 10)
        addHistoryEntry({
            game: 'Колесо фортуны',
            symbol: '🎡',
            bet,
            payout,
            netChange: payout - bet,
            outcome,
            label: `Сектор x${multiplier}`,
        })
    }

    
    const buyOrEquipItem = (item, isAuthenticated = false) => {
        if (!isAuthenticated) {
            return { ok: false, message: 'Войдите в аккаунт, чтобы покупать товары.' }
        }

        if (!item || typeof item.id !== 'string' || typeof item.category !== 'string') {
            return { ok: false, message: 'Не удалось определить товар.' }
        }

        
        if (item.category === 'chips') {
            if (!Number.isFinite(item.chipsAmount) || item.chipsAmount <= 0) {
                return { ok: false, message: 'Некорректный пакет фишек.' }
            }
            addChips(item.chipsAmount)
            return { ok: true, message: `Начислено +${item.chipsAmount} фишек!` }
        }

        
        if (!['cards', 'tables', 'avatars'].includes(item.category) ||
            typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) {
            return { ok: false, message: 'Некорректный товар.' }
        }

        const alreadyOwned = ownedItems.value.includes(item.id)
        if (!alreadyOwned) {
            if (!spendChips(item.price)) {
                return { ok: false, message: 'Недостаточно фишек на балансе!' }
            }

            ownedItems.value.push(item.id)
        }

        equipped.value[item.category] = item.id

        if (item.category === 'avatars') {
            avatarId.value = item.id.replace('avatar-', '')
        } else if (item.category === 'cards') {
            activeCardBack.value = item.id
        } else if (item.category === 'tables') {
            activeTableTheme.value = item.id
        }

        const action = alreadyOwned ? 'Экипировано' : 'Куплено и установлено'
        return { ok: true, message: `${action}: «${item.title}»` }
    }

    
    const resetLocalProgress = ({ reload = false } = {}) => {
        skipProgressPersistence = true
        if (typeof window !== 'undefined') {
            for (const key of [STORAGE_KEY, PROGRESS_OWNER_KEY]) {
                try {
                    window.localStorage.removeItem(key)
                } catch (error) {
                    console.error(`Не удалось очистить локальный прогресс (${key}):`, error)
                }
            }
        }
        name.value = 'Player'
        hasLocalProgress.value = false
        level.value = 1
        xp.value = 0
        chips.value = 5000
        avatarId.value = 'spade'
        dailyBonusLastClaimedAt.value = 0
        activeCardBack.value = 'card-classic'
        activeTableTheme.value = 'table-emerald'
        claimedAchievementIds.value = []
        stats.value = createDefaultStats()
        ownedItems.value = [...DEFAULT_OWNED_ITEMS]
        equipped.value = createDefaultEquipped()
        gameHistory.value = []
        nextTick(() => {
            skipProgressPersistence = false
        })
        if (reload && typeof window !== 'undefined') window.location.reload()
    }

    const resetProgress = () => resetLocalProgress({ reload: true })


    
    const addHistoryEntry = ({ game, symbol, bet, payout, netChange, outcome, label }) => {
        const now = new Date()
        const timeStr = `Сегодня, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`

        gameHistory.value.unshift({
            id: Date.now(),
            game,
            symbol,
            bet,
            payout,
            netChange,
            outcome,
            label,
            time: timeStr,
        })

        
        if (gameHistory.value.length > 30) {
            gameHistory.value.pop()
        }
    }

    watch(
        () => ({
            level: level.value,
            xp: xp.value,
            chips: chips.value,
            dailyBonusLastClaimedAt: dailyBonusLastClaimedAt.value,
            avatarId: avatarId.value,
            activeCardBack: activeCardBack.value,
            activeTableTheme: activeTableTheme.value,
            stats: stats.value,
            ownedItems: ownedItems.value,
            equipped: equipped.value,
            claimedAchievementIds: claimedAchievementIds.value,
            gameHistory: gameHistory.value,
        }),
        (progress) => {
            if (skipProgressPersistence || typeof window === 'undefined') return

            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
                hasLocalProgress.value = true
            } catch (error) {
                console.error('Не удалось сохранить прогресс:', error)
            }
        },
        { deep: true },
    )

    return {
        name,
        hasLocalProgress,
        level,
        xp,
        chips,
        avatarId,
        dailyBonusLastClaimedAt,
        dailyBonusReadyAt,
        activeCardBack,
        activeTableTheme,
        stats,
        ownedItems,
        equipped,
        achievements,
        claimedAchievementIds,
        gameHistory,


        nextLevelXp,
        xpPercentage,
        totalGames,
        draws,
        winRate,

        setName,
        setAvatar,
        addChips,
        claimDailyBonus,
        spendChips,
        addXp,
        recordBlackjackRound,
        recordDiceRound,
        recordFortuneRound,
        buyOrEquipItem,
        resetLocalProgress,
        resetProgress,
        getProgressSnapshot,
        canMigrateProgressTo,
        setProgressOwner,
        applyServerState,
    }
})