export const FHIR_SCHEMA = `
CREATE TABLE IF NOT EXISTS Patient (
  id TEXT PRIMARY KEY,
  name TEXT,
  birthDate TEXT,
  gender TEXT,
  telecom TEXT
);

CREATE TABLE IF NOT EXISTS Observation (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  code TEXT,
  display TEXT,
  value TEXT,
  unit TEXT,
  issued TEXT,
  FOREIGN KEY (patientId) REFERENCES Patient(id)
);

CREATE TABLE IF NOT EXISTS Condition (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  code TEXT,
  display TEXT,
  onsetDateTime TEXT,
  recordedDate TEXT,
  FOREIGN KEY (patientId) REFERENCES Patient(id)
);

CREATE TABLE IF NOT EXISTS DocumentReference (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  filename TEXT,
  mimeType TEXT,
  data BLOB,
  uploadedAt TEXT,
  FOREIGN KEY (patientId) REFERENCES Patient(id)
);

CREATE TABLE IF NOT EXISTS ChatMessage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientId TEXT,
  role TEXT,
  content TEXT,
  timestamp TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS Task (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  description TEXT,
  status TEXT,
  assignedTo TEXT,
  createdAt TEXT,
  completedAt TEXT
);
`;