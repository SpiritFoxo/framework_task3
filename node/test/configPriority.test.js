import test from "node:test";
import assert from "node:assert/strict";
import { buildConfig, validateConfig } from "../src/config.js";

test("Приоритет источников настроек работает как заявлено", () => {
  const fileCfg = { app: { rateLimits: { readPerMinute: 10 } } };
  const env = { APP_READ_PER_MINUTE: "20" };
  const args = { readPerMinute: "30" };

  const cfg = buildConfig({ fileCfg, env, args });
  assert.equal(cfg.app.rateLimits.readPerMinute, 30);
});

test("Окружение перекрывает файл, но уступает аргументам", () => {
  const fileCfg = { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 10, writePerMinute: 5 } } };
  const env = { APP_PORT: "4000" };
  const args = { port: "5000" };

  const cfg = buildConfig({ fileCfg, env, args });
  assert.equal(cfg.app.port, 5000);
});

test("Некорректные настройки дают ошибки проверки", () => {
  const cfg = { app: { mode: "x", port: 0, trustedOrigins: [], rateLimits: { readPerMinute: 0, writePerMinute: 0 } } };
  const errors = validateConfig(cfg);
  assert.ok(errors.length >= 3);
});

test("Некорректный URL в доверенных источниках даёт ошибку", () => {
  const cfg = { app: { mode: "учебный", port: 3000, trustedOrigins: ["not-a-url"], rateLimits: { readPerMinute: 10, writePerMinute: 5 } } };
  const errors = validateConfig(cfg);
  assert.ok(errors.some(e => e.includes("не-a-url") || e.includes("not-a-url") || e.includes("неверно")));
});

test("Лимит записи выше лимита чтения даёт ошибку", () => {
  const cfg = { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 5, writePerMinute: 10 } } };
  const errors = validateConfig(cfg);
  assert.ok(errors.some(e => e.includes("Лимит записи не должен быть выше")));
});
