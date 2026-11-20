import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { chipOptions } from '@/utils/data'
import { getFortuneWheelTargetRotation } from '@/utils/fortuneWheel'
import { sound } from '@/utils/sound'
import { runPlayerOperation } from '@/services/gameApi'

const SPIN_DURATION = 5000

export function useFortuneWheel() {
    const playerStore = usePlayerStore()
    const selectedBet = ref(100)
    const wheelRotation = ref(0)
    const isSpinning = ref(false)
    const result = ref(null)
    const errorMessage = ref('')
    const recentSpins = ref([])
    const canSpin = computed(() => !isSpinning.value && playerStore.chips >= selectedBet.value)

    let spinId = 0

    const setBet = (amount) => {
        if (isSpinning.value || !chipOptions.some((chip) => chip.amount === amount)) return
        if (amount <= playerStore.chips) selectedBet.value = amount
    }

    const spin = async () => {
        if (!canSpin.value) return

        const bet = selectedBet.value
        const startedAt = Date.now()
        result.value = null
        errorMessage.value = ''
        isSpinning.value = true
        sound.playChip()
        sound.playSpinningRouletteWheel()

        try {
            const round = await runPlayerOperation('/games/fortune/round', { bet }, playerStore)
            const turns = 5 + Math.floor(Math.random() * 3)
            wheelRotation.value = getFortuneWheelTargetRotation(
                wheelRotation.value,
                round.segmentIndex,
                turns,
            )
            await new Promise((resolve) => setTimeout(resolve, Math.max(0, SPIN_DURATION - (Date.now() - startedAt))))

            result.value = {
                ...round.segment,
                bet: round.bet,
                payout: round.payout,
                profit: round.netChange,
                outcome: round.outcome,
            }
            if (round.outcome === 'win') sound.playWin()

            recentSpins.value.unshift({
                id: ++spinId,
                ...round.segment,
                outcome: round.outcome,
                bet: round.bet,
                payout: round.payout,
            })
            if (recentSpins.value.length > 6) recentSpins.value.pop()
        } catch (error) {
            errorMessage.value = error.message
        } finally {
            isSpinning.value = false
        }
    }

    return {
        selectedBet,
        wheelRotation,
        isSpinning,
        result,
        errorMessage,
        recentSpins,
        canSpin,
        setBet,
        spin,
    }
}
