export const fortuneWheelSegments = [
    { id: 'double', label: 'x2', multiplier: 2, color: '#0369a1' },
    { id: 'zero-a', label: 'x0', multiplier: 0, color: '#7f1d1d' },
    { id: 'zero-b', label: 'x0', multiplier: 0, color: '#1e3a5f' },
    { id: 'one-and-half', label: 'x1.5', multiplier: 1.5, color: '#6b21a8' },
    { id: 'ten', label: 'x10', multiplier: 10, color: '#a16207' },
    { id: 'zero-c', label: 'x0', multiplier: 0, color: '#7f1d1d' },
    { id: 'zero-d', label: 'x0', multiplier: 0, color: '#166534' },
    { id: 'zero-e', label: 'x0', multiplier: 0, color: '#1e3a5f' },
    { id: 'five', label: 'x5', multiplier: 5, color: '#be123c' },
    { id: 'zero-f', label: 'x0', multiplier: 0, color: '#7f1d1d' },
    { id: 'zero-g', label: 'x0', multiplier: 0, color: '#166534' },
]

export const getFortuneWheelTargetRotation = (currentRotation, segmentIndex, turns = 5) => {
    if (!Number.isFinite(currentRotation) || !Number.isInteger(segmentIndex) ||
        segmentIndex < 0 || segmentIndex >= fortuneWheelSegments.length ||
        !Number.isInteger(turns) || turns < 1) {
        throw new RangeError('Invalid fortune wheel spin parameters')
    }

    const segmentAngle = 360 / fortuneWheelSegments.length
    const targetAngle = (360 - segmentIndex * segmentAngle) % 360
    const currentAngle = ((currentRotation % 360) + 360) % 360
    const extraRotation = (targetAngle - currentAngle + 360) % 360

    return currentRotation + turns * 360 + extraRotation
}

export const getFortuneWheelSegmentIndex = (random = Math.random) => {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError('Random value must be in the range [0, 1)')
    }
    return Math.floor(value * fortuneWheelSegments.length)
}
