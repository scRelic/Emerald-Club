const localHostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
const API_BASE_URL = ((import.meta.env && import.meta.env.VITE_API_BASE_URL) || `http://${localHostname}:5000/api`)
    .replace(/\/+$/, '');

export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const apiRequest = async (path, { method = 'GET', body } = {}) => {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError('Не удалось подключиться к серверу. Проверьте, запущен ли backend.');
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        throw new ApiError(payload?.message || `Ошибка запроса (${response.status}).`, response.status);
    }

    return payload;
};
