import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiRequest } from '../services/api.js';
import { usePlayerStore } from './playerStore.js';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const player = ref(null);
    const isAuthenticated = computed(() => user.value !== null);
    const restoreError = ref('');
    const syncError = ref('');
    const isPlayerStateReady = ref(false);
    const playerStore = usePlayerStore();
    let restorePromise = null;

    const updatePlayerSummary = (state) => {
        player.value = {
            ...player.value,
            displayName: state.name,
            level: state.level,
            xp: state.xp,
            chips: state.chips,
        };
    };

    const setSession = (session) => {
        user.value = session.user;
        player.value = session.player;
        playerStore.setName(session.player.displayName);
        restoreError.value = '';
        syncError.value = '';
    };

    const initializePlayerState = async () => {
        isPlayerStateReady.value = false;
        const state = await apiRequest('/player/state', {
            method: 'POST',
        });

        if (!playerStore.applyServerState(state)) {
            throw new Error('Сервер вернул некорректное состояние профиля.');
        }

        updatePlayerSummary(state);
        isPlayerStateReady.value = true;
        syncError.value = '';
    };

    const retryPlayerStateLoad = () => {
        if (!user.value) return;
        return initializePlayerState().catch((error) => {
            syncError.value = error.message;
            console.error('Не удалось повторить загрузку профиля:', error);
        });
    };

    const updateDisplayName = async (name) => {
        if (!user.value || !isPlayerStateReady.value) {
            throw new Error('Войдите в аккаунт, чтобы изменить никнейм.');
        }

        const state = await apiRequest('/player/name', {
            method: 'PUT',
            body: { name },
        });

        playerStore.setName(state.name);
        player.value = { ...player.value, displayName: state.name };
        return state.name;
    };

    const register = async (credentials) => {
        playerStore.resetLocalProgress();
        const session = await apiRequest('/auth/register', { method: 'POST', body: credentials });
        setSession(session);
        try {
            await initializePlayerState();
        } catch (error) {
            syncError.value = error.message;
            throw error;
        }
    };

    const login = async (credentials) => {
        playerStore.resetLocalProgress();
        const session = await apiRequest('/auth/login', { method: 'POST', body: credentials });
        setSession(session);
        try {
            await initializePlayerState();
        } catch (error) {
            syncError.value = error.message;
            throw error;
        }
    };

    const restoreSession = () => {
        if (user.value && isPlayerStateReady.value) return Promise.resolve(true);
        if (restorePromise) return restorePromise;

        restorePromise = (async () => {
            let session;
            try {
                session = await apiRequest('/auth/me');
            } catch (error) {
                user.value = null;
                player.value = null;
                isPlayerStateReady.value = false;
                playerStore.resetLocalProgress();
                restoreError.value = error.status === 401 ? '' : error.message;
                return false;
            }

            setSession(session);
            try {
                await initializePlayerState();
            } catch (error) {
                syncError.value = error.message;
                console.error('Не удалось загрузить профиль с сервера:', error);
            }
            return true;
        })().finally(() => {
            restorePromise = null;
        });

        return restorePromise;
    };

    const logout = async () => {
        await apiRequest('/auth/logout', { method: 'POST' });
        user.value = null;
        player.value = null;
        isPlayerStateReady.value = false;
        syncError.value = '';
        restoreError.value = '';
        playerStore.resetLocalProgress();
    };

    return {
        user,
        player,
        isAuthenticated,
        restoreError,
        syncError,
        register,
        login,
        restoreSession,
        logout,
        retryPlayerStateLoad,
        updateDisplayName,
    };
});
