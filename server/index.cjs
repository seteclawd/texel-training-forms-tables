// Adaptador VPS (Express) sobre el mismo núcleo que usa el Worker.
const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createApi } = require('./src/core.cjs');

const PORT = Number(process.env.PORT || 8922);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'crew.db');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

// PDFs en disco, misma interfaz que el binding R2 del Worker.
const diskFiles = {
  async put(key, bytes) {
    fs.writeFileSync(path.join(PDF_DIR, path.basename(key)), Buffer.from(bytes));
    return key;
  },
  async get(key) {
    const p = path.join(PDF_DIR, path.basename(key));
    if (!fs.existsSync(p)) return null;
    return { body: fs.createReadStream(p), contentType: 'application/pdf' };
  },
};

// Correo: SMTP del VPS (nodemailer) si hay credenciales.
let mailer = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  mailer = {
    async send({ subject, text, pdfBase64, pdfName }) {
      const attachments = pdfBase64
        ? [{ filename: pdfName, content: String(pdfBase64).replace(/^data:[^;]+;base64,/, ''), encoding: 'base64' }]
        : [];
      await transporter.sendMail({ from: process.env.SMTP_USER, to: process.env.MAIL_TO || 'luis.rivas@texelair.com', subject, text, attachments });
      return true;
    },
  };
}

const api = createApi({ db, files: diskFiles, mailer });
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(async (req, res) => {
  const out = await api.handle({
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query || {},
    body: req.body || {},
  });
  if (out.binary) {
    res.set('content-type', out.contentType || 'application/octet-stream');
    return out.body.pipe ? out.body.pipe(res) : res.send(Buffer.from(out.body));
  }
  res.status(out.status).json(out.body);
});

app.listen(PORT, '0.0.0.0', () => console.log(`Texel Training Forms (tables) en :${PORT}`));
