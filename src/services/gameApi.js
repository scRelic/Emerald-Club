import { apiRequest } from './api.js'

const retryRequestIds = new Map()

export const runPlayerOperation = async (path, operation, playerStore) => {
    const operationKey = `${path}:${JSON.stringify(operation)}`
    const requestId = retryRequestIds.get(operationKey) || globalThis.crypto?.randomUUID?.()
    if (!requestId) throw new Error('В этом браузере недоступна безопасная генерация идентификатора операции.')
    retryRequestIds.set(operationKey, requestId)

    const response = await apiRequest(path, {
        method: 'POST',
        body: { ...operation, requestId },
    })
    if (!response?.playerState || !playerStore.applyServerState(response.playerState)) {
        throw new Error('Сервер вернул некорректное состояние профиля.')
    }

    retryRequestIds.delete(operationKey)
    return response.result
}
