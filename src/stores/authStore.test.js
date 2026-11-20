import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from './authStore.js';
import { usePlayerStore } from './playerStore.js';

test('logout clears browser progress and login restores the server profile', async () => {
    const previousWindow = globalThis.window;
    const previousFetch = globalThis.fetch;
    const values = new Map();
    let reloadCount = 0;
    const savedState = {
        name: 'test-user',
        level: 7,
        xp: 64,
        chips: 5250,
        stats: {
            blackjack: { betsCount: 0, wins: 0, losses: 0, draws: 0, naturals21: 0 },
            poker: { betsCount: 0, wins: 0, losses: 0, draws: 0, straights: 0, flushes: 0, straightFlushes: 0, kare: 0, royalFlushes: 0 },
            roulette: { betsCount: 0, wins: 0, losses: 0, zeroHits: 0, biggestWin: 0 },
            dice: { betsCount: 0, wins: 0, losses: 0, biggestWin: 0 },
            fortune: { betsCount: 0, wins: 0, losses: 0, draws: 0, biggestWin: 0 },
        },
        claimedAchievementIds: [],
        ownedItems: ['card-classic', 'table-emerald', 'avatar-spade'],
        equipped: {
            cards: 'card-classic',
            tables: 'table-emerald',
            avatars: 'avatar-spade',
        },
        gameHistory: [],
    };

    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: (key) => values.delete(key),
        },
        location: {
            hostname: 'localhost',
            reload: () => reloadCount++,
        },
    };
    globalThis.fetch = async (url) => {
        const path = new URL(url).pathname;
        const payload = path.endsWith('/auth/login')
            ? {
                user: { id: 'test-user', username: 'test-user' },
                player: { id: 'player-1', displayName: 'test-user', level: 1, xp: 0, chips: 5000 },
            }
            : path.endsWith('/player/state')
                ? savedState
                : { success: true };

        return {
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => payload,
        };
    };

    try {
        setActivePinia(createPinia());
        const playerStore = usePlayerStore();
        playerStore.level = 7;
        playerStore.xp = 64;
        playerStore.addChips(250);
        playerStore.stats.poker.wins = 3;
        playerStore.gameHistory.unshift({ game: 'Рулетка', payout: 5000, id: 'round-1' });
        playerStore.setProgressOwner('test-user');
        await nextTick();
        assert.equal(values.size, 2);

        const authStore = useAuthStore();
        authStore.user = { id: 'test-user', username: 'test-user' };
        await authStore.logout();

        assert.equal(authStore.isAuthenticated, false);
        assert.equal(values.size, 0);
        assert.equal(reloadCount, 0);

        setActivePinia(createPinia());
        const restoredPlayerStore = usePlayerStore();
        assert.equal(restoredPlayerStore.level, 1);
        assert.equal(restoredPlayerStore.xp, 0);
        assert.equal(restoredPlayerStore.chips, 5000);
        assert.equal(restoredPlayerStore.stats.poker.wins, 0);
        assert.equal(restoredPlayerStore.gameHistory.length, 0);

        const restoredAuthStore = useAuthStore();
        await restoredAuthStore.login({ username: 'test-user', password: 'password' });

        assert.equal(restoredAuthStore.isAuthenticated, true);
        assert.equal(restoredPlayerStore.level, 7);
        assert.equal(restoredPlayerStore.xp, 64);
        assert.equal(restoredPlayerStore.chips, 5250);
        assert.equal(restoredPlayerStore.stats.poker.wins, 0);
        assert.equal(restoredPlayerStore.gameHistory.length, 0);
    } finally {
        if (previousWindow === undefined) {
            delete globalThis.window;
        } else {
            globalThis.window = previousWindow;
        }
        globalThis.fetch = previousFetch;
    }
});
