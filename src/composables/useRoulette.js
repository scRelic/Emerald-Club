import { ref, computed } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { sound } from '@/utils/sound'
import {
    getRouletteNumberColor,
    isValidRouletteBetKey,
    isValidRouletteChipAmount,
    ROULETTE_CHIP_AMOUNTS,
} from '@/utils/roulette'
import { runPlayerOperation } from '@/services/gameApi'

export function useRoulette() {
    const playerStore = usePlayerStore()

    const selectedChip = ref(100) 
    const bets = ref({}) 
    const isSpinning = ref(false)
    const displayNumber = ref(null)
    const errorMessage = ref('')
    const lastWinningNumber = ref(null)
    const lastWinAmount = ref(0)
    const lastNetChange = ref(null)
    const spinHistory = ref([]) 

    
    const chipValues = ROULETTE_CHIP_AMOUNTS

    
    const totalBetAmount = computed(() => {
        return Object.values(bets.value).reduce((sum, val) => sum + val, 0)
    })

    
    const placeBet = (betKey) => {
        if (isSpinning.value) return
        const amount = selectedChip.value

        if (!isValidRouletteBetKey(betKey) || !isValidRouletteChipAmount(amount)) return
        if (totalBetAmount.value + amount > playerStore.chips) return

        
        bets.value[betKey] = (bets.value[betKey] || 0) + amount
        sound.playChip()
    }

    
    const clearBets = () => {
        if (isSpinning.value) return
        
        bets.value = {}
        lastWinAmount.value = 0
        lastNetChange.value = null
        sound.playClick()
    }

    
    const spinRoulette = async () => {
        if (isSpinning.value || totalBetAmount.value === 0) return

        const currentBets = { ...bets.value }
        const startedAt = Date.now()
        isSpinning.value = true
        displayNumber.value = Math.floor(Math.random() * 37)
        lastWinAmount.value = 0
        lastNetChange.value = null
        errorMessage.value = ''
        sound.playSpinningRouletteWheel()

        const numberShuffle = setInterval(() => {
            displayNumber.value = Math.floor(Math.random() * 37)
        }, 90)

        try {
            const settlement = await runPlayerOperation(
                '/games/roulette/round',
                { bets: currentBets },
                playerStore,
            )
            await new Promise((resolve) => setTimeout(
                resolve,
                Math.max(0, 5000 - (Date.now() - startedAt)),
            ))
            clearInterval(numberShuffle)
            const winningNum = settlement.winningNumber
            displayNumber.value = winningNum
            lastWinningNumber.value = winningNum

            
            spinHistory.value.unshift({
                number: winningNum,
                color: getRouletteNumberColor(winningNum)
            })
            if (spinHistory.value.length > 10) spinHistory.value.pop()

            
            const totalWin = settlement.payout
            if (totalWin > 0) {
                lastWinAmount.value = totalWin
                sound.playWin()
            }
            lastNetChange.value = settlement.netChange
            bets.value = {}
        } catch (error) {
            errorMessage.value = error.message
        } finally {
            clearInterval(numberShuffle)
            isSpinning.value = false
        }
    }

    return {
        selectedChip,
        chipValues,
        bets,
        isSpinning,
        displayNumber,
        errorMessage,
        lastWinningNumber,
        lastWinAmount,
        spinHistory,
        lastNetChange,
        totalBetAmount,
        getNumberColor: getRouletteNumberColor,
        placeBet,
        clearBets,
        spinRoulette,
    }
}