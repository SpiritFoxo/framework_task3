import test from "node:test";
import assert from "node:assert/strict";
import { buildConfig, getMode, getRateLimits } from "../src/config.js";

// Вспомогательная функция: эмулирует обработку ошибки как в server.js
function handleError(mode, errorMessage) {
  return mode === "учебный" ? errorMessage : "Ошибка обработки запроса";
}

test("В учебном режиме сообщение об ошибке содержит подробности", () => {
  const cfg = buildConfig({
    fileCfg: { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 60, writePerMinute: 20 } } },
    env: {},
    args: {}
  });

  const mode = getMode(cfg);
  assert.equal(mode, "учебный");

  const msg = handleError(mode, "Поле name не должно быть пустым");
  assert.equal(msg, "Поле name не должно быть пустым");
});

test("В боевом режиме сообщение об ошибке нейтральное", () => {
  const cfg = buildConfig({
    fileCfg: { app: { mode: "боевой", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 60, writePerMinute: 20 } } },
    env: {},
    args: {}
  });

  const mode = getMode(cfg);
  assert.equal(mode, "боевой");

  const msg = handleError(mode, "Поле name не должно быть пустым");
  assert.equal(msg, "Ошибка обработки запроса");
  assert.notEqual(msg, "Поле name не должно быть пустым");
});

test("Переключение режима через переменную окружения не требует изменения кода", () => {
  const base = { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 60, writePerMinute: 20 } } };

  const cfgDev = buildConfig({ fileCfg: base, env: {}, args: {} });
  const cfgProd = buildConfig({ fileCfg: base, env: { APP_MODE: "боевой" }, args: {} });

  assert.equal(getMode(cfgDev),  "учебный");
  assert.equal(getMode(cfgProd), "боевой");
});

test("Переключение режима через аргумент командной строки перекрывает окружение", () => {
  const base = { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 60, writePerMinute: 20 } } };

  const cfg = buildConfig({ fileCfg: base, env: { APP_MODE: "учебный" }, args: { mode: "боевой" } });
  assert.equal(getMode(cfg), "боевой");
});

test("Лимиты в учебном и боевом режиме могут задаваться независимо", () => {
  const devCfg = buildConfig({
    fileCfg: { app: { mode: "учебный", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 60, writePerMinute: 20 } } },
    env: {},
    args: {}
  });
  const prodCfg = buildConfig({
    fileCfg: { app: { mode: "боевой", port: 3000, trustedOrigins: ["http://localhost:5173"], rateLimits: { readPerMinute: 10, writePerMinute: 2 } } },
    env: {},
    args: {}
  });

  const devLimits  = getRateLimits(devCfg);
  const prodLimits = getRateLimits(prodCfg);

  assert.ok(devLimits.readPerMinute > prodLimits.readPerMinute,
    "В учебном режиме лимит чтения может быть выше, чем в боевом");
});
