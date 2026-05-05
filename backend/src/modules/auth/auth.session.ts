import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../../config/env.js";
import type { AuthRole, SessionPayload } from "./auth.types.js";

const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/",
};

const sessionCookieName = env.SESSION_COOKIE_NAME;
const jwtExpiresIn = env.JWT_EXPIRES_IN as StringValue;

const signSessionToken = (userId: string, role: AuthRole): string =>
  jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: jwtExpiresIn,
  });

const readTokenPayload = (token: string): SessionPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string") {
      return null;
    }

    const sub = typeof decoded.sub === "string" && decoded.sub.trim().length > 0
      ? decoded.sub
      : null;

    const role = decoded.role === "vendor" || decoded.role === "admin"
      ? decoded.role
      : null;

    if (!sub || !role) {
      return null;
    }

    return { sub, role };
  } catch {
    return null;
  }
};

export const setSessionCookie = (
  response: Response,
  userId: string,
  role: AuthRole,
): void => {
  const token = signSessionToken(userId, role);
  response.cookie(sessionCookieName, token, sessionCookieOptions);
};

export const clearSessionCookie = (response: Response): void => {
  response.clearCookie(sessionCookieName, sessionCookieOptions);
};

export const readSessionUserIdFromRequest = (request: Request): string | null => {
  const token = request.cookies?.[sessionCookieName];
  if (typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  const payload = readTokenPayload(token);
  return payload?.sub ?? null;
};

export const readSessionRoleFromRequest = (request: Request): AuthRole | null => {
  const token = request.cookies?.[sessionCookieName];
  if (typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  const payload = readTokenPayload(token);
  return payload?.role ?? null;
};
