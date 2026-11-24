// Server HTTP minimal untuk AI Financial Assistant (Tahap D PRD).
//
// Sengaja tanpa framework dan tanpa dependensi baru: cukup Node.js. Backend ini
// hanya meneruskan pertanyaan ke penyedia AI setelah memverifikasi sesi pengguna
// dan menghitung angka lewat fungsi keuangan aplikasi.
//
// Jalankan: npm run server

import { createServer } from "node:http";
import { handleAssistantAsk, MAX_QUESTION_LENGTH } from "./assistant.js";
import { describeServerEnv, readServerEnv } from "./env.js";
import { createRateLimiter } from "./rateLimit.js";
import { parseAccessToken } from "./supabaseAuth.js";

function jsonResponse(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  res.end(payload);
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(Object.assign(new Error("payload_too_large"), { code: "payload_too_large" }));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (text.trim() === "") {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(Object.assign(new Error("invalid_json"), { code: "invalid_json" }));
      }
    });

    req.on("error", () => reject(Object.assign(new Error("read_error"), { code: "read_error" })));
  });
}

export function createAssistantServer({ config = readServerEnv(), limiter, fetchImpl = fetch } = {}) {
  const activeLimiter = limiter ?? createRateLimiter({ max: config.rateLimitMax, windowMs: config.rateLimitWindowMs });

  const server = createServer(async (req, res) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin.replace(/\/+$/, "") : "";
    const allowedList = Array.isArray(config.allowedOrigins) ? config.allowedOrigins : [config.allowedOrigin];
    const originAllowed = origin === "" || allowedList.includes(origin);
    const corsHeaders =
      originAllowed && origin
        ? {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            Vary: "Origin",
          }
        : {};

    if (req.method === "OPTIONS") {
      if (!originAllowed) {
        jsonResponse(res, 403, { ok: false, error: "Origin tidak diizinkan." });
        return;
      }
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    let pathname = "/";
    try {
      pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;
    } catch {
      jsonResponse(res, 400, { ok: false, error: "Alamat permintaan tidak valid." });
      return;
    }

    try {
      if (req.method === "GET" && pathname === "/api/health") {
        jsonResponse(
          res,
          200,
          {
            ok: true,
            layanan: "fintrack-assistant",
            penyediaAi: config.aiEnabled ? "aktif" : "belum dikonfigurasi",
            supabase: config.supabaseUrl && config.supabaseAnonKey ? "aktif" : "belum dikonfigurasi",
          },
          corsHeaders,
        );
        return;
      }

      if (req.method === "POST" && pathname === "/api/assistant/ask") {
        if (!originAllowed) {
          jsonResponse(res, 403, { ok: false, error: "Origin tidak diizinkan." }, corsHeaders);
          return;
        }

        let body;
        try {
          body = await readJsonBody(req, config.maxBodyBytes);
        } catch (error) {
          const tooLarge = error.code === "payload_too_large";
          jsonResponse(
            res,
            tooLarge ? 413 : 400,
            { ok: false, error: tooLarge ? "Permintaan terlalu besar." : "Body permintaan bukan JSON yang valid." },
            corsHeaders,
          );
          return;
        }

        const result = await handleAssistantAsk({
          token: parseAccessToken(req.headers.authorization),
          question: body?.question,
          month: body?.month,
          config,
          limiter: activeLimiter,
          fetchImpl,
        });

        const extraHeaders =
          result.status === 429 && result.body?.retryAfterSeconds
            ? { ...corsHeaders, "Retry-After": String(result.body.retryAfterSeconds) }
            : corsHeaders;

        jsonResponse(res, result.status, result.body, extraHeaders);
        return;
      }

      jsonResponse(res, 404, { ok: false, error: "Endpoint tidak ditemukan." }, corsHeaders);
    } catch {
      // Pesan generik: detail internal tidak pernah dibocorkan ke pengguna.
      jsonResponse(res, 500, { ok: false, error: "Terjadi kesalahan di server asisten." }, corsHeaders);
    }
  });

  return { server, config, limiter: activeLimiter };
}

export const QUESTION_LENGTH_LIMIT = MAX_QUESTION_LENGTH;

const isMainModule =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (isMainModule) {
  const { server, config } = createAssistantServer();
  server.listen(config.port, () => {
    console.log("FinTrack Assistant API berjalan.");
    console.log(`Alamat   : http://localhost:${config.port}`);
    console.log(`Konfigurasi: ${JSON.stringify(describeServerEnv(config))}`);
    if (!config.aiEnabled) {
      console.log("Catatan  : AI_PROVIDER_API_KEY / AI_MODEL belum diisi, jawaban akan dihitung aplikasi.");
    }
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
