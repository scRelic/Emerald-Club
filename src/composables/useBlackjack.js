import { computed, onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { calculateHandScore } from '@/utils/deck'
import { sound } from '@/utils/sound'
import { apiRequest } from '@/services/api'
import { runPlayerOperation } from '@/services/gameApi'
import { chipOptions } from '@/utils/data'

export function useBlackjack() {
    const playerStore = usePlayerStore()
    const playerCards = ref([])
    const dealerCards = ref([])
    const gameStatus = ref('idle')
    const currentBet = ref(100)
    const resultMessage = ref('')
    const resultType = ref('neutral')
    const errorMessage = ref('')
    const isSubmitting = ref(false)

    const playerScore = computed(() => calculateHandScore(playerCards.value))
    const visibleDealerScore = computed(() => {
        if (!dealerCards.value.length) return 0
        if (gameStatus.value === 'playing') {
            return calculateHandScore([dealerCards.value[0]])
        }
        return calculateHandScore(dealerCards.value)
    })
    const canDouble = computed(() => (
        gameStatus.value === 'playing' &&
        !isSubmitting.value &&
        playerCards.value.length === 2 &&
        playerStore.chips >= currentBet.value
    ))

    const applyRoundState = (state) => {
        playerCards.value = state.playerCards
        dealerCards.value = state.dealerCards
        currentBet.value = state.currentBet
        gameStatus.value = state.status
        resultMessage.value = state.message || ''
        resultType.value = state.outcome === 'blackjack'
            ? 'blackjack'
            : state.outcome === 'draw'
                ? 'neutral'
                : state.outcome || 'neutral'
    }

    const setBet = (amount) => {
        if (gameStatus.value === 'playing' || gameStatus.value === 'dealerTurn' || isSubmitting.value) return
        if (chipOptions.some((chip) => chip.amount === amount) && amount <= playerStore.chips) {
            currentBet.value = amount
            sound.playChip()
        }
    }

    const startNewGame = async () => {
        if (gameStatus.value === 'playing' || isSubmitting.value) return
        if (playerStore.chips < currentBet.value) {
            resultType.value = 'loss'
            resultMessage.value = 'Недостаточно фишек для этой ставки!'
            return
        }

        isSubmitting.value = true
        errorMessage.value = ''
        resultMessage.value = ''
        sound.playChip()
        try {
            const state = await runPlayerOperation(
                '/games/blackjack/start',
                { bet: currentBet.value },
                playerStore,
            )
            applyRoundState(state)
            state.playerCards.forEach(() => sound.playCard())
        } catch (error) {
            errorMessage.value = error.message
        } finally {
            isSubmitting.value = false
        }
    }

    const makeAction = async (action) => {
        if (gameStatus.value !== 'playing' || isSubmitting.value) return

        isSubmitting.value = true
        errorMessage.value = ''
        if (action === 'hit' || action === 'double') sound.playCard()
        try {
            const state = await runPlayerOperation(
                '/games/blackjack/action',
                { action },
                playerStore,
            )
            applyRoundState(state)
            if (state.outcome === 'win' || state.outcome === 'blackjack') sound.playWin()
        } catch (error) {
            errorMessage.value = error.message
        } finally {
            isSubmitting.value = false
        }
    }

    const hit = () => makeAction('hit')
    const doubleDown = () => {
        if (canDouble.value) return makeAction('double')
    }
    const stand = () => makeAction('stand')

    onMounted(async () => {
        try {
            const { session } = await apiRequest('/games/blackjack/session')
            if (session) applyRoundState(session)
        } catch (error) {
            errorMessage.value = error.message
        }
    })

    return {
        playerCards,
        dealerCards,
        gameStatus,
        currentBet,
        resultMessage,
        resultType,
        errorMessage,
        isSubmitting,
        playerScore,
        visibleDealerScore,
        canDouble,
        setBet,
        startNewGame,
        hit,
        doubleDown,
        stand,
    }
}
