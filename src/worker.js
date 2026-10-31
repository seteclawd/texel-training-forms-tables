// Entrada para Cloudflare Workers: Basic Auth + assets + API sobre D1 y R2.
import core from "./core.cjs";
import { isAuthorized, unauthorized } from "./auth.js";

const { createApi } = core;

function sessionDb(env) {
  return typeof env.DB.withSession === "function" ? env.DB.withSession("first-primary") : env.DB;
}

const R2_PREFIX = "texel-training-forms/";

// PDFs en R2; si el binding no existe, el formulario se guarda igual sin PDF.
function r2Files(env) {
  if (!env.FILES) return null;
  return {
    async put(key, bytes, { contentType } = {}) {
      await env.FILES.put(R2_PREFIX + key, bytes, { httpMetadata: { contentType: contentType || "application/octet-stream" } });
      return key;
    },
    async get(key) {
      const obj = await env.FILES.get(R2_PREFIX + key);
      if (!obj) return null;
      return { body: obj.body, contentType: obj.httpMetadata && obj.httpMetadata.contentType };
    },
  };
}

// Correo por API HTTP (Resend). Sin clave, el envío queda registrado como "skipped".
function httpMailer(env) {
  if (!env.RESEND_API_KEY) return null;
  const from = env.MAIL_FROM || "onboarding@resend.dev";
  const to = env.MAIL_TO || "luis.rivas@texelair.com";
  return {
    async send({ subject, text, pdfBase64, pdfName }) {
      const payload = { from, to: [to], subject, text };
      if (pdfBase64) {
        payload.attachments = [{ filename: pdfName, content: String(pdfBase64).replace(/^data:[^;]+;base64,/, "") }];
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return true;
    },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!isAuthorized(request, env)) return unauthorized();

    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    let body = null;
    if (request.method !== "GET" && request.method !== "DELETE") {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const api = createApi({ db: sessionDb(env), files: r2Files(env), mailer: httpMailer(env) });
    try {
      const out = await api.handle({
        method: request.method,
        path: url.pathname,
        headers: Object.fromEntries(request.headers),
        query: Object.fromEntries(url.searchParams),
        body,
      });
      if (out.binary) {
        return new Response(out.binary, {
          status: out.status,
          headers: {
            "content-type": out.contentType || "application/octet-stream",
            "content-disposition": `attachment; filename="${out.filename || "file"}"`,
            "cache-control": "no-store",
          },
        });
      }
      return new Response(JSON.stringify(out.body), {
        status: out.status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String((e && e.message) || e) }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
};
