-- Texel Training Forms: tripulación y formularios EDTO.
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
  pdf_path TEXT,
  pdf_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_forms_trainee ON forms(trainee_code);
