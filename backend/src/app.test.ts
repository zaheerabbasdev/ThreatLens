import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const app = createApp();

describe("app", () => {
  it("GET /api/v1/health returns ok with a standard success envelope", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(typeof res.body.data.uptimeSeconds).toBe("number");
  });

  it("attaches a request ID to every response", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("reuses a caller-supplied request ID when it looks like a UUID", async () => {
    const id = "11111111-1111-1111-1111-111111111111";
    const res = await request(app).get("/api/v1/health").set("X-Request-Id", id);
    expect(res.headers["x-request-id"]).toBe(id);
  });

  it("ignores a caller-supplied request ID that isn't a UUID (log/header injection guard)", async () => {
    const res = await request(app).get("/api/v1/health").set("X-Request-Id", "<script>evil</script>");
    expect(res.headers["x-request-id"]).not.toBe("<script>evil</script>");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("returns a structured 404 for an unmatched route, with no stack trace or internal detail", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: expect.stringContaining("/api/v1/this-route-does-not-exist"),
        requestId: expect.any(String),
      },
    });
  });

  it("rejects an oversized JSON body instead of parsing it", async () => {
    const res = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send({ payload: "x".repeat(200_000) });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("sets baseline security headers", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("does not echo an unlisted Origin back in Access-Control-Allow-Origin", async () => {
    const res = await request(app).get("/api/v1/health").set("Origin", "https://evil.example.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows a configured Origin", async () => {
    const res = await request(app).get("/api/v1/health").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});
