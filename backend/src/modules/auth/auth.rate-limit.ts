import type { NextFunction, Request, Response } from "express";

const AUTH_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5;

const attemptsByIp = new Map<string, number[]>();

const getClientIp = (req: Request): string => req.ip || "unknown";

const getActiveAttempts = (timestamps: number[], now: number): number[] =>
  timestamps.filter((timestamp) => now - timestamp < AUTH_RATE_LIMIT_WINDOW_MS);

export const authRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const activeAttempts = getActiveAttempts(attemptsByIp.get(ip) ?? [], now);

  if (activeAttempts.length >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
    attemptsByIp.set(ip, activeAttempts);
    return res.status(429).json({
      ok: false,
      message:
        "Demasiados intentos de inicio de sesion. Intenta nuevamente en 30 minutos",
    });
  }

  attemptsByIp.set(ip, [...activeAttempts, now]);
  next();
};

export const resetAuthRateLimitStore = (): void => {
  attemptsByIp.clear();
};

export {
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  AUTH_RATE_LIMIT_WINDOW_MS,
};