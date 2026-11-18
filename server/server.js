const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.WEBHOOK_SECRET || "";
const ROOT = path.resolve(__dirname, "..");
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const DB = path.join(DATA, "signals.jsonl");
fs.mkdirSync(DATA, { recursive: true });
function reply(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(body));
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > 16384) { reject(new Error("Payload excede 16 KB")); req.destroy(); }
    });
    req.on("end", () => resolve(body)); req.on("error", reject);
  });
}
function history(limit = 50) {
  if (!fs.existsSync(DB)) return [];
  return fs.readFileSync(DB, "utf8").split("\n").filter(Boolean).slice(-limit).reverse().flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/api/health") return reply(res, 200, { ok: true, service: "cerebro-meta", webhookConfigured: Boolean(SECRET) });
  if (req.method === "GET" && url.pathname === "/api/metrics") {
    const rows = history(200);
    const calls = rows.filter(x => x.signal === "CALL").length;
    const puts = rows.filter(x => x.signal === "PUT").length;
    return reply(res, 200, { total: rows.length, calls, puts,
      callShare: rows.length ? Number((calls / rows.length * 100).toFixed(1)) : null,
      putShare: rows.length ? Number((puts / rows.length * 100).toFixed(1)) : null,
      note: "Distribuição dos alertas recebidos; não representa taxa de acerto nem rentabilidade." });
  }
  if (req.method === "GET" && url.pathname === "/api/signals") {
    const n = Math.max(1, Math.min(200, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    return reply(res, 200, { signals: history(n) });
  }
  if (req.method === "POST" && url.pathname === "/webhook/tradingview") {
    if (!SECRET) return reply(res, 503, { error: "WEBHOOK_SECRET não configurado" });
    try {
      let payload;
      try { payload = JSON.parse(await readBody(req)); } catch { return reply(res, 400, { error: "JSON inválido" }); }
      if (!safeEqual(payload.secret || "", SECRET)) return reply(res, 401, { error: "Token inválido" });
      const signal = String(payload.signal || "").toUpperCase();
      const symbol = String(payload.symbol || "").slice(0, 40);
      const timeframe = String(payload.timeframe || "").slice(0, 10);
      if (!["CALL", "PUT"].includes(signal) || !symbol || !timeframe) return reply(res, 422, { error: "signal, symbol e timeframe são obrigatórios" });
      const row = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), signal, symbol, timeframe,
        close: payload.close ?? null, rsi: payload.rsi ?? null, adx: payload.adx ?? null, bar_time: payload.bar_time ?? null };
      fs.appendFileSync(DB, JSON.stringify(row) + "\n", { encoding: "utf8", mode: 0o600 });
      return reply(res, 201, { accepted: true, signal: row });
    } catch (error) { return reply(res, 500, { error: error.message || "Falha interna" }); }
  }
  if (req.method === "GET") {
    let pathname;
    try { pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname); }
    catch { return reply(res, 400, { error: "Caminho inválido" }); }
    const allowed = new Set(["/index.html", "/styles.css", "/app.js", "/cerebro_meta_tradingview.pine"]);
    if (!allowed.has(pathname)) return reply(res, 404, { error: "Não encontrado" });
    const file = path.join(ROOT, pathname.slice(1));
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".pine": "text/plain; charset=utf-8" };
    return fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end("Não encontrado"); }
      res.writeHead(200, { "Content-Type": types[path.extname(file)], "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" }); res.end(data);
    });
  }
  return reply(res, 405, { error: "Método não permitido" });
});
server.listen(PORT, "0.0.0.0", () => console.log(`CÉREBRO META ativo na porta ${PORT}`));
