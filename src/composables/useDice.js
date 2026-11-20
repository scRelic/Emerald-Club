import { computed, onBeforeUnmount, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { chipOptions } from '@/utils/data'
import { rollDice } from '@/utils/dice'
import { sound } from '@/utils/sound'
import { runPlayerOperation } from '@/services/gameApi'

const ROLL_DURATION = 1200

export function useDice() {
    const playerStore = usePlayerStore()
    const dice = ref([3, 4])
    const selectedBet = ref(100)
    const selectedPrediction = ref('low')
    const isRolling = ref(false)
    const result = ref(null)
    const errorMessage = ref('')
    const recentRolls = ref([])
    const canRoll = computed(() => !isRolling.value && playerStore.chips >= selectedBet.value)

    const predictions = [
        { id: 'low', label: 'Меньше 7', details: 'Сумма 2–6', multiplier: 'x2' },
        { id: 'high', label: 'Больше 7', details: 'Сумма 8–12', multiplier: 'x2' },
        { id: 'exact', label: 'Ровно 7', details: 'Точное попадание', multiplier: 'x5' },
    ]

    let animationInterval
    let rollId = 0

    const setBet = (amount) => {
        if (isRolling.value || !chipOptions.some((chip) => chip.amount === amount)) return
        if (amount <= playerStore.chips) selectedBet.value = amount
    }

    const roll = async () => {
        if (!canRoll.value) return

        const bet = selectedBet.value
        const prediction = selectedPrediction.value
        result.value = null
        errorMessage.value = ''
        isRolling.value = true
        sound.playChip()
        sound.playDiceRoll()
        animationInterval = setInterval(() => {
            dice.value = rollDice()
        }, 75)

        const startedAt = Date.now()
        try {
            const round = await runPlayerOperation('/games/dice/round', { bet, prediction }, playerStore)
            await new Promise((resolve) => setTimeout(resolve, Math.max(0, ROLL_DURATION - (Date.now() - startedAt))))

            dice.value = round.dice
            result.value = {
                ...round,
                profit: round.netChange,
            }
            if (round.payout > 0) sound.playWin()

            recentRolls.value.unshift({
                id: ++rollId,
                dice: round.dice,
                total: round.total,
                outcome: round.outcome,
            })
            if (recentRolls.value.length > 6) recentRolls.value.pop()
        } catch (error) {
            errorMessage.value = error.message
        } finally {
            clearInterval(animationInterval)
            animationInterval = undefined
            isRolling.value = false
        }
    }

    onBeforeUnmount(() => {
        clearInterval(animationInterval)
    })

    return {
        dice,
        selectedBet,
        selectedPrediction,
        isRolling,
        result,
        errorMessage,
        recentRolls,
        canRoll,
        predictions,
        setBet,
        roll,
    }
}
