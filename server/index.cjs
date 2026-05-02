const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 8921;
const DB_PATH = path.join(__dirname, '..', 'data', 'crew.db');

// Ensure data dir exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Init DB
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS crew (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    licence TEXT,
    email TEXT,
    is_sfi INTEGER DEFAULT 0,
    is_sfe INTEGER DEFAULT 0,
    is_tri INTEGER DEFAULT 0,
    is_tre INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_type TEXT NOT NULL,
    trainee_code TEXT,
    trainee_name TEXT,
    trainee_rank TEXT,
    sim_registration TEXT,
    session_type TEXT,
    date TEXT,
    edto_expiry TEXT,
    location TEXT,
    checklist_json TEXT,
    item_signatures_json TEXT,
    trainer_name TEXT,
    trainer_signature TEXT,
    trainee_signature TEXT,
    general_comments TEXT,
    prepared_by TEXT,
    submitted_at TEXT,
    pdf_path TEXT
  );
`);

// Migrate: add new columns if table already exists without them
try { db.prepare(`ALTER TABLE forms ADD COLUMN item_signatures_json TEXT`).run(); } catch (e) { /* exists */ }
try { db.prepare(`ALTER TABLE forms ADD COLUMN prepared_by TEXT`).run(); } catch (e) { /* exists */ }

// Seed crew if empty
const count = db.prepare('SELECT COUNT(*) as c FROM crew').get().c;
if (count === 0) {
  const crewData = [
    ["ACU","ABEL FLORES CUELLAR","FO","","",0,0,0,0],
    ["ALH","ALEXANDER HEIM","FO","","",0,0,0,0],
    ["AKN","ALLISTER KNIGHT","CAPT","","",0,0,0,0],
    ["AMO","ANDERS MOELLER","FO","","",0,0,0,0],
    ["AAV","ANDREAS AVGOUSTI","FO","","",0,0,0,0],
    ["ATO","ANDREW TONKS","CAPT","","andrew.tonks@texelair.com",0,0,1,1],
    ["APO","ANDRZEJ POCHANKE","CAPT","","",0,0,0,0],
    ["DBA","DENIS BAZE","FO","","",0,0,0,0],
    ["DPA","DIMITRIOS PAPADIMITRIOU","CAPT","","dimitrios.papadimitriou@texelair.com",0,0,1,1],
    ["DVE","DOMINIQUE VERLINDE","FO","","",0,0,0,0],
    ["DMI","DUSAN MITROVIC","FO","","",0,0,0,0],
    ["GPI","GRANT PIENAAR","CAPT","","grant.pienaar@texelair.com",0,0,1,0],
    ["HAN","HAKAN MAGNUS ANDERSSON","CAPT","","",0,0,0,0],
    ["HLA","HANS LARSEN","CAPT","","morten.larsen@texelair.com",0,0,1,1],
    ["HBR","HENDRIK BRINK","CAPT","","",0,0,0,0],
    ["KOL","KJELD OLSEN","CAPT","","",0,0,0,0],
    ["KGE","KOSTA GEORGACACOS","CAPT","","kosta.georgacacos@texelair.com",0,0,1,0],
    ["KJU","KRESTEN JUSTESEN","CAPT","","",0,0,0,0],
    ["LLA","LEONARD LAMPRECHT","CAPT","","",0,0,0,0],
    ["LCU","LUCA CUCCUI","FO","","",0,0,0,0],
    ["LRO","LUIS RIVAS ROBLES","CAPT","","luis.rivas@texelair.com",0,0,1,0],
    ["MRZ","MARCO MARITZ","CAPT","","",0,0,0,0],
    ["MPE","MARCO PENNACCHI","CAPT","","",0,0,0,0],
    ["MAR","MARIO MARGARA","FO","","",0,0,0,0],
    ["MTU","MARK TURNER","CAPT","","",0,0,0,0],
    ["MFI","MARKO FILIPOVIC","FO","","",0,0,0,0],
    ["MMI","MARKO MITROVIC","FO","","",0,0,0,0],
    ["MDI","MELVIN DICKSON","CAPT","","",0,0,0,0],
    ["MFE","MILLAN DOPAZO FERNANDEZ","CAPT","","",0,0,0,0],
    ["NRA","NIGEL RAMPHAL","CAPT","","",0,0,0,0],
    ["PPA","PAVLOS PAVLOU","CAPT","","",0,0,0,0],
    ["PSC","PIERRE SCOFFOM","FO","","",0,0,0,0],
    ["RHA","RAYMOND HARDWICH","CA","","",0,0,0,0],
    ["RZI","ROLANDS ZIRJANOVS","FO","","",0,0,0,0],
    ["SST","SEAN STEDMAN","CAPT","","sean.stedman@texelair.com",0,0,1,1],
    ["SKL","SHAUN VAN DER KLASHORST","FO","","",0,0,0,0],
    ["SIM","SIMOS MICHAIL","CAPT","","",0,0,0,0],
    ["SKR","STEPHANE KRAUSE","CAPT","","",0,0,0,0],
    ["TDA","THEODOROS DAVID","CAPT","","theo.david@texelair.com",0,0,1,1],
    ["TSE","THOMAS SELVEJER","CAPT","","",0,0,0,0],
    ["TGA","TOMAS GAMERO","CAPT","","",0,0,0,0],
    ["TSO","TONY SOBERON","CAPT","","tony.soberon@texelair.com",0,0,1,1],
    ["VMA","VASILEIOS MAGIAFAS","FO","","",0,0,0,0],
    ["GFO","GEORGIOS FOURFIS","SFE","","george.fourfis@texelair.com",1,1,0,0]
  ];
  
    const insert = db.prepare('INSERT INTO crew (code, name, position, licence, email, is_sfi, is_sfe, is_tri, is_tre) VALUES (?,?,?,?,?,?,?,?,?)');
    const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
    insertMany(crewData);
    console.log('Seeded', crewData.length, 'crew members');
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'sete.manuals@gmail.com',
    pass: 'tlexqdwkhplnlkzn'
  }
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// API: list crew
app.get('/api/crew', (req, res) => {
  const rows = db.prepare('SELECT * FROM crew ORDER BY name').all();
  res.json(rows);
});

// API: get crew by code
app.get('/api/crew/:code', (req, res) => {
  const row = db.prepare('SELECT * FROM crew WHERE code = ?').get(req.params.code.toUpperCase());
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// API: add crew
app.post('/api/crew', (req, res) => {
  const { code, name, position, licence, email, is_sfi, is_sfe, is_tri, is_tre } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO crew (code, name, position, licence, email, is_sfi, is_sfe, is_tri, is_tre) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(code, name, position, licence || '', email || '', is_sfi ? 1 : 0, is_sfe ? 1 : 0, is_tri ? 1 : 0, is_tre ? 1 : 0);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// API: submit EDTO form
app.post('/api/forms/edto/submit', async (req, res) => {
  try {
    const data = req.body;
    const submittedAt = new Date().toISOString();

    // Save to DB
    const result = db.prepare(`
      INSERT INTO forms (form_type, trainee_code, trainee_name, trainee_rank, sim_registration, session_type, date, edto_expiry, location, checklist_json, item_signatures_json, trainer_name, trainer_signature, trainee_signature, general_comments, prepared_by, submitted_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      'EDTO',
      data.traineeCode || '',
      data.traineeName || '',
      data.traineeRank || '',
      data.simRegistration || '',
      data.sessionType || '',
      data.date || '',
      data.edtoExpiry || '',
      data.location || '',
      JSON.stringify(data.checklist || {}),
      JSON.stringify(data.itemSignatures || {}),
      data.trainerName || '',
      data.trainerSignature || '',
      data.traineeSignature || '',
      data.generalComments || '',
      data.preparedBy || '',
      submittedAt
    );

    // Generate PDF filename
    const pdfDir = path.join(__dirname, '..', 'data', 'pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfName = `EDTO_${data.traineeCode || 'XXX'}_${data.date || 'nodate'}_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfName);

    // If PDF base64 provided, save it
    if (data.pdfBase64) {
      const base64Data = data.pdfBase64.replace(/^data:[^;]+;base64,/, '');
      const buf = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(pdfPath, buf);
    }

    // Send email
    const mailOptions = {
      from: 'sete.manuals@gmail.com',
      to: 'luis.rivas@texelair.com',
      subject: `EDTO Training Form - ${data.traineeName || 'Unknown'} - ${data.date || ''}`,
      text: `EDTO Training Form submitted.

Trainee: ${data.traineeName} (${data.traineeCode})
Rank: ${data.traineeRank}
Date: ${data.date}
Session Type: ${data.sessionType}
Location: ${data.location}
Trainer: ${data.trainerName}
Prepared by: ${data.preparedBy || 'N/A'}

General Comments:
${data.generalComments || 'None'}
`,
      attachments: data.pdfBase64 ? [{
        filename: pdfName,
        path: pdfPath
      }] : []
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, id: result.lastInsertRowid, pdfName });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Texel Training Forms server running on port ${PORT}`);
});
