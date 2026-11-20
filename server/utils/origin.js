export const isAllowedOrigin = (origin, allowedOrigins, isProduction) => {
    if (typeof origin !== 'string' || !origin) return false;
    if (allowedOrigins.includes(origin)) return true;

    return !isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};
