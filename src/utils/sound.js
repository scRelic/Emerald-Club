class SoundManager {
    constructor() {
        this.muted = false

        
        this.sounds = {
            chip: new Audio('/sounds/placing-poker-chips.mp3'),
            card: new Audio('/sounds/taking-playing-card-3.mp3'),
            win: new Audio('/sounds/sound_win.mp3'),
            fold: new Audio('/sounds/community-flipcard.mp3'),
            check: new Audio('/sounds/pounding-cards-on-table.mp3'),
            spinning_roulette_wheel: new Audio('/sounds/tihaya-ruletka.mp3'),
        }

        
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.4
        })
    }

    play(soundName) {
        if (this.muted) return
        const sound = this.sounds[soundName]
        if (sound) {
            sound.currentTime = 0 
            sound.play().catch(() => {
                
            })
        }
    }

    playClick() { this.play('click') }
    playChip() { this.play('chip') }
    playCard() { this.play('card') }
    playDiceRoll() {
        if (this.muted) return

        const AudioContextConstructor = typeof window !== 'undefined'
            && (window.AudioContext || window.webkitAudioContext)
        if (!AudioContextConstructor) {
            this.play('check')
            return
        }

        const context = new AudioContextConstructor()
        const sampleCount = Math.floor(context.sampleRate * 0.08)
        const noiseBuffer = context.createBuffer(1, sampleCount, context.sampleRate)
        const noise = noiseBuffer.getChannelData(0)

        for (let index = 0; index < sampleCount; index++) {
            noise[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount)
        }

        const startTime = context.currentTime
        const impacts = [0, 0.11, 0.2, 0.31, 0.4, 0.49]
        let lastSource

        impacts.forEach((offset, index) => {
            const source = context.createBufferSource()
            const filter = context.createBiquadFilter()
            const gain = context.createGain()
            const impactTime = startTime + offset

            source.buffer = noiseBuffer
            filter.type = 'lowpass'
            filter.frequency.setValueAtTime(700 + Math.random() * 1500, impactTime)
            gain.gain.setValueAtTime(0.0001, impactTime)
            gain.gain.exponentialRampToValueAtTime(0.12, impactTime + 0.006)
            gain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.075)

            source.connect(filter)
            filter.connect(gain)
            gain.connect(context.destination)
            source.start(impactTime)
            source.stop(impactTime + 0.08)
            if (index === impacts.length - 1) lastSource = source
        })

        lastSource.addEventListener('ended', () => context.close(), { once: true })
        context.resume().catch(() => this.play('check'))
    }
    playSpin() { this.play('spin') }
    playWin() { this.play('win') }
    playFold() { this.play('fold') }
    playCheck() { this.play('check') }
    playSpinningRouletteWheel() { this.play('spinning_roulette_wheel') }
}

export const sound = new SoundManager()