import test from 'node:test'
import assert from 'node:assert/strict'
import { runPlayerOperation } from './gameApi.js'

test('retries an uncertain operation with the same id but gives a new action a fresh id', async () => {
    const previousFetch = globalThis.fetch
    const sentRequests = []
    let failFirstRequest = true
    globalThis.fetch = async (url, options) => {
        const body = JSON.parse(options.body)
        sentRequests.push(body)
        if (failFirstRequest) {
            failFirstRequest = false
            throw new Error('connection lost')
        }

        return {
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({
                result: { payout: 100 },
                playerState: { chips: 5100 },
            }),
        }
    }

    try {
        const playerStore = { applyServerState: () => true }
        await assert.rejects(
            runPlayerOperation('/games/dice/round', { bet: 100, prediction: 'high' }, playerStore),
        )
        await runPlayerOperation('/games/dice/round', { bet: 100, prediction: 'high' }, playerStore)
        await runPlayerOperation('/games/dice/round', { bet: 100, prediction: 'high' }, playerStore)

        assert.equal(sentRequests[0].requestId, sentRequests[1].requestId)
        assert.notEqual(sentRequests[1].requestId, sentRequests[2].requestId)
    } finally {
        globalThis.fetch = previousFetch
    }
})
