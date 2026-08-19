import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import type { Role } from "../types/user.js";

const ISSUER = "threatlens-api";
const AUDIENCE = "threatlens-client";
// Never accept arbitrary JWT algorithms (spec §17) — this is the only
// algorithm both signed with and, more importantly, accepted at verify time.
const ALGORITHM = "HS256";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenClaims {
  sub: string; // userId
  org: string; // organizationId
  role: Role;
}

export interface RefreshTokenClaims {
  sub: string;
  org: string;
  /** Unique per issued token — the identity a rotation/revocation store tracks. */
  jti: string;
  /** Shared across every token descended from one login, for reuse-detection (see refreshTokenStore). */
  family: string;
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  // jti isn't used for revocation (access tokens are short-lived and
  // intentionally stateless) — it just guarantees two tokens signed with
  // identical claims within the same second aren't byte-identical, which
  // HS256 would otherwise produce since JWT signing is deterministic.
  return new SignJWT({ ...claims, type: "access", jti: randomUUID() })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(accessSecret);
}

export interface SignedRefreshToken {
  token: string;
  jti: string;
  family: string;
}

/** `family` is reused across a login's whole token lineage; omit it to start a new one (fresh login). */
export async function signRefreshToken(sub: string, org: string, family: string = randomUUID()): Promise<SignedRefreshToken> {
  const jti = randomUUID();
  const token = await new SignJWT({ sub, org, jti, family, type: "refresh" })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(refreshSecret);
  return { token, jti, family };
}

export class TokenError extends Error {}

/** `type` claim is checked so an access token can never be presented where a refresh token is expected, or vice versa. */
async function verify<T>(token: string, secret: Uint8Array, expectedType: "access" | "refresh"): Promise<T> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALGORITHM],
    });
    if (payload["type"] !== expectedType) {
      throw new TokenError(`Expected a ${expectedType} token`);
    }
    return payload as T;
  } catch (err) {
    if (err instanceof TokenError) throw err;
    if (err instanceof joseErrors.JWTExpired) throw new TokenError("Token expired");
    throw new TokenError("Token invalid");
  }
}

export function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  return verify<AccessTokenClaims>(token, accessSecret, "access");
}

export function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  return verify<RefreshTokenClaims>(token, refreshSecret, "refresh");
}
