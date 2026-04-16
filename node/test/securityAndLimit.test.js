import test from "node:test";
import assert from "node:assert/strict";
import { applyCors, applySecurityHeaders, createRateLimiter } from "../src/security.js";

test("Недоверенный источник не получает разрешающий заголовок", () => {
  const req = { headers: { origin: "http://evil.local" } };
  const headers = new Map();
  const res = { setHeader(k, v) { headers.set(k, v); } };

  applyCors(req, res, ["http://localhost:5173"]);
  assert.equal(headers.has("Access-Control-Allow-Origin"), false);
});

test("Доверенный источник получает разрешающий заголовок", () => {
  const req = { headers: { origin: "http://localhost:5173" } };
  const headers = new Map();
  const res = { setHeader(k, v) { headers.set(k, v); } };

  applyCors(req, res, ["http://localhost:5173"]);
  assert.equal(headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
});

test("Ограничитель частоты блокирует лишние запросы", () => {
  const limiter = createRateLimiter({ readPerMinute: 2, writePerMinute: 1 });

  const req = { method: "GET", url: "/api/items", socket: { remoteAddress: "1.2.3.4" }, headers: {} };

  assert.equal(limiter.allow(req), true);
  assert.equal(limiter.allow(req), true);
  assert.equal(limiter.allow(req), false);
});

test("Ограничитель записи независим от ограничителя чтения", () => {
  const limiter = createRateLimiter({ readPerMinute: 100, writePerMinute: 1 });

  const writeReq = { method: "POST", url: "/api/items", socket: { remoteAddress: "2.3.4.5" } };
  const readReq  = { method: "GET",  url: "/api/items", socket: { remoteAddress: "2.3.4.5" } };

  assert.equal(limiter.allow(writeReq), true);
  assert.equal(limiter.allow(writeReq), false); // превышен лимит записи
  assert.equal(limiter.allow(readReq),  true);  // чтение по-прежнему работает
});

test("Защитные заголовки выставляются на каждый ответ", () => {
  const headers = new Map();
  const res = { setHeader(k, v) { headers.set(k, v); } };

  applySecurityHeaders(res);

  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.ok(headers.has("Cache-Control"));
});
