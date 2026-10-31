// Núcleo neutral de Texel Training Forms (EDTO).
// La BBDD entra por `q` (D1 en Cloudflare, better-sqlite3 en el VPS) y los PDFs
// por `files.put/get` (R2 en Cloudflare, disco en el VPS).

const json = (status, body) => ({ status, body });

const nowIso = () => new Date().toISOString();

const PDF_RE = /^[\w.\-]{1,180}\.pdf$/;

function createApi({ db, files = null, mailer = null }) {
  const q = (sql) => db.prepare(sql);

  return {
    async handle({ method, path, headers, query, body }) {
      const seg = path.split("/").filter(Boolean);

      // ---------- CREW ----------
      if (path === "/api/crew" && method === "GET") {
        const rows = (await q("SELECT * FROM crew ORDER BY name").all()).results;
        return json(200, rows);
      }

      if (seg[0] === "api" && seg[1] === "crew" && seg.length === 3 && method === "GET") {
        const row = await q("SELECT * FROM crew WHERE code = ?1").bind(String(seg[2]).toUpperCase()).first();
        if (!row) return json(404, { error: "Not found" });
        return json(200, row);
      }

      if (path === "/api/crew" && method === "POST") {
        const b = body || {};
        if (!b.code || !b.name) return json(400, { error: "code y name son obligatorios" });
        try {
          const r = await q(
            `INSERT INTO crew (code, name, position, licence, email, is_sfi, is_sfe, is_tri, is_tre)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
          )
            .bind(
              String(b.code).toUpperCase(),
              b.name,
              b.position || "",
              b.licence || "",
              b.email || "",
              b.is_sfi ? 1 : 0,
              b.is_sfe ? 1 : 0,
              b.is_tri ? 1 : 0,
              b.is_tre ? 1 : 0
            )
            .run();
          return json(200, { id: r.meta && r.meta.last_row_id });
        } catch (e) {
          return json(400, { error: String((e && e.message) || e) });
        }
      }

      // ---------- FORMS: listado (para el listado de desarrollo) ----------
      if (path === "/api/forms" && method === "GET") {
        const rows = (
          await q(
            `SELECT id, form_type, trainee_code, trainee_name, trainee_rank, session_type, date,
                    location, trainer_name, prepared_by, submitted_at, pdf_key
             FROM forms ORDER BY id DESC LIMIT 100`
          ).all()
        ).results;
        return json(200, rows);
      }

      // ---------- FORMS: descarga del PDF ----------
      if (seg[0] === "api" && seg[1] === "forms" && seg.length === 3 && seg[2] !== "edto" && method === "GET") {
        const row = await q("SELECT pdf_key FROM forms WHERE id = ?1").bind(Number(seg[2]) || -1).first();
        if (!row || !row.pdf_key) return json(404, { error: "Sin PDF" });
        if (!files) return json(501, { error: "Almacenamiento de PDFs no configurado" });
        const obj = await files.get(row.pdf_key);
        if (!obj) return json(404, { error: "PDF no encontrado" });
        return { status: 200, binary: obj.body, contentType: "application/pdf", filename: row.pdf_key };
      }

      // ---------- FORMS: envío EDTO ----------
      if (path === "/api/forms/edto/submit" && method === "POST") {
        const d = body || {};
        const submittedAt = nowIso();

        const r = await q(
          `INSERT INTO forms (form_type, trainee_code, trainee_name, trainee_rank, sim_registration, session_type,
                              date, edto_expiry, location, checklist_json, item_signatures_json, trainer_name,
                              trainer_signature, trainee_signature, general_comments, prepared_by, submitted_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)`
        )
          .bind(
            "EDTO",
            d.traineeCode || "",
            d.traineeName || "",
            d.traineeRank || "",
            d.simRegistration || "",
            d.sessionType || "",
            d.date || "",
            d.edtoExpiry || "",
            d.location || "",
            JSON.stringify(d.checklist || {}),
            JSON.stringify(d.itemSignatures || {}),
            d.trainerName || "",
            d.trainerSignature || "",
            d.traineeSignature || "",
            d.generalComments || "",
            d.preparedBy || "",
            submittedAt
          )
          .run();

        const id = r.meta && r.meta.last_row_id;
        const pdfName = `EDTO_${d.traineeCode || "XXX"}_${d.date || "nodate"}_${Date.now()}.pdf`;

        let pdfKey = null;
        if (d.pdfBase64 && files) {
          const b64 = String(d.pdfBase64).replace(/^data:[^;]+;base64,/, "");
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          await files.put(pdfName, bytes, { contentType: "application/pdf" });
          pdfKey = pdfName;
          await q("UPDATE forms SET pdf_key = ?1 WHERE id = ?2").bind(pdfName, id).run();
        }

        // El correo no puede tumbar el envío: si no hay proveedor, se registra y sigue.
        let email = "skipped";
        if (mailer) {
          try {
            await mailer.send({
              subject: `EDTO Training Form - ${d.traineeName || "Unknown"} - ${d.date || ""}`,
              text: [
                "EDTO Training Form submitted.",
                "",
                `Trainee: ${d.traineeName} (${d.traineeCode})`,
                `Rank: ${d.traineeRank}`,
                `Date: ${d.date}`,
                `Session Type: ${d.sessionType}`,
                `Location: ${d.location}`,
                `Trainer: ${d.trainerName}`,
                `Prepared by: ${d.preparedBy || "N/A"}`,
                "",
                "General Comments:",
                d.generalComments || "None",
              ].join("\n"),
              pdfBase64: d.pdfBase64 || null,
              pdfName,
            });
            email = "sent";
          } catch (e) {
            email = "error: " + String((e && e.message) || e);
          }
        }

        return json(200, { success: true, id, pdfName, pdfKey, email });
      }

      return json(404, { error: "Ruta no encontrada" });
    },
  };
}

module.exports = { createApi, PDF_RE };
