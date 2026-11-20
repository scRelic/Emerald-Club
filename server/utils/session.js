import { createHash } from 'node:crypto';

export const SESSION_COOKIE = 'emerald_session';

export const hashSessionToken = (token) => createHash('sha256').update(token).digest();

export const readSessionToken = (req) => {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const cookie = cookies
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

    return cookie ? cookie.slice(SESSION_COOKIE.length + 1) : null;
};

export const cookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    };
};
