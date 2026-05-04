import dotenv from "dotenv";
dotenv.config();
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
};
const readStringEnv = (name, fallback) => {
    const value = process.env[name];
    if (typeof value !== "string") {
        return fallback;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};
const readBooleanEnv = (name, fallback) => {
    const value = process.env[name];
    if (value === undefined) {
        return fallback;
    }
    return value.trim().toLowerCase() === "true";
};
export const env = {
    PORT: Number(process.env.PORT ?? 3001),
    FRONTEND_ORIGIN: readStringEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
    SUPABASE_URL: requireEnv("SUPABASE_URL"),
    SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY"),
    JWT_SECRET: requireEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: readStringEnv("JWT_EXPIRES_IN", "12h"),
    SESSION_COOKIE_NAME: readStringEnv("SESSION_COOKIE_NAME", "vendor_session"),
    COOKIE_SECURE: readBooleanEnv("COOKIE_SECURE", false),
};
//# sourceMappingURL=env.js.map