import test from 'node:test'
import assert from 'node:assert/strict'
import {
    fortuneWheelSegments,
    getFortuneWheelSegmentIndex,
    getFortuneWheelTargetRotation,
} from './fortuneWheel.js'

test('wheel has the requested multipliers in order', () => {
    assert.deepEqual(
        fortuneWheelSegments.map(({ multiplier }) => multiplier),
        [2, 0, 0, 1.5, 10, 0, 0, 0, 5, 0, 0],
    )
})

test('wheel rotation stops with the selected segment centered under the pointer', () => {
    const segmentAngle = 360 / fortuneWheelSegments.length

    for (let index = 0; index < fortuneWheelSegments.length; index++) {
        const rotation = getFortuneWheelTargetRotation(1975, index, 5)
        const expectedAngle = (360 - index * segmentAngle) % 360
        const actualAngle = ((rotation % 360) + 360) % 360

        assert.ok(Math.abs(actualAngle - expectedAngle) < 1e-9)
        assert.ok(rotation - 1975 >= 5 * 360)
    }
})

test('wheel selection maps random values to valid sectors', () => {
    assert.equal(getFortuneWheelSegmentIndex(() => 0), 0)
    assert.equal(getFortuneWheelSegmentIndex(() => 0.999), fortuneWheelSegments.length - 1)
    assert.throws(() => getFortuneWheelSegmentIndex(() => 1), RangeError)
    assert.throws(() => getFortuneWheelSegmentIndex(() => -0.1), RangeError)
})

test('wheel rejects invalid spin parameters', () => {
    assert.throws(() => getFortuneWheelTargetRotation(0, -1), RangeError)
    assert.throws(() => getFortuneWheelTargetRotation(0, 0, 0), RangeError)
})
