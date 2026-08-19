import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenError,
} from "./tokens.js";

describe("tokens", () => {
  it("round-trips a valid access token", async () => {
    const token = await signAccessToken({ sub: "user_1", org: "org_1", role: "viewer" });
    const claims = await verifyAccessToken(token);
    expect(claims).toMatchObject({ sub: "user_1", org: "org_1", role: "viewer" });
  });

  it("round-trips a valid refresh token and preserves jti/family", async () => {
    const { token, jti, family } = await signRefreshToken("user_1", "org_1");
    const claims = await verifyRefreshToken(token);
    expect(claims.jti).toBe(jti);
    expect(claims.family).toBe(family);
  });

  it("rejects an access token presented where a refresh token is expected (type confusion)", async () => {
    const accessToken = await signAccessToken({ sub: "user_1", org: "org_1", role: "viewer" });
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow(TokenError);
  });

  it("rejects a refresh token presented where an access token is expected (type confusion)", async () => {
    const { token } = await signRefreshToken("user_1", "org_1");
    await expect(verifyAccessToken(token)).rejects.toThrow(TokenError);
  });

  it("rejects a token signed with a different secret", async () => {
    const forged = await new SignJWT({ sub: "user_1", org: "org_1", role: "super_admin", type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("threatlens-api")
      .setAudience("threatlens-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("a-completely-different-secret-value-xx"));
    await expect(verifyAccessToken(forged)).rejects.toThrow(TokenError);
  });

  it("rejects the 'none' algorithm — never accept arbitrary JWT algorithms (spec §17)", async () => {
    // Hand-build an unsigned "none"-alg token: base64url(header).base64url(payload).
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "user_1",
        org: "org_1",
        role: "super_admin",
        type: "access",
        iss: "threatlens-api",
        aud: "threatlens-client",
        exp: Math.floor(Date.now() / 1000) + 900,
      }),
    ).toString("base64url");
    const noneAlgToken = `${header}.${payload}.`;
    await expect(verifyAccessToken(noneAlgToken)).rejects.toThrow(TokenError);
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ sub: "user_1", org: "org_1", role: "viewer", type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("threatlens-api")
      .setAudience("threatlens-client")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(new TextEncoder().encode(process.env["JWT_ACCESS_SECRET"]!));
    await expect(verifyAccessToken(expired)).rejects.toThrow(TokenError);
  });

  it("rejects a token with the wrong audience", async () => {
    const wrongAudience = await new SignJWT({ sub: "user_1", org: "org_1", role: "viewer", type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("threatlens-api")
      .setAudience("some-other-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(process.env["JWT_ACCESS_SECRET"]!));
    await expect(verifyAccessToken(wrongAudience)).rejects.toThrow(TokenError);
  });

  it("issues distinct access tokens even for identical claims signed in immediate succession", async () => {
    const claims = { sub: "user_1", org: "org_1", role: "viewer" } as const;
    const [a, b] = await Promise.all([signAccessToken(claims), signAccessToken(claims)]);
    expect(a).not.toBe(b);
  });
});
