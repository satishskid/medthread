import { getDB } from './initDB';

export const savePatient = (patient: any) => {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Patient (id, name, birthDate, gender, telecom)
    VALUES (@id, @name, @birthDate, @gender, @telecom)
  `);
  stmt.run(patient);
  stmt.free();
};

export const getPatient = (id: string) => {
  const db = getDB();
  const stmt = db.prepare("SELECT * FROM Patient WHERE id = ?");
  const result = stmt.getAsObject([id]);
  stmt.free();
  return result;
};

export const addChatMessage = (msg: any) => {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO ChatMessage (patientId, role, content, timestamp, metadata)
    VALUES (@patientId, @role, @content, @timestamp, @metadata)
  `);
  stmt.run(msg);
  stmt.free();
};

export const getChatMessages = (patientId: string) => {
  const db = getDB();
  const stmt = db.prepare("SELECT * FROM ChatMessage WHERE patientId = ? ORDER BY timestamp");
  const result = stmt.getAsObject([patientId]);
  stmt.free();
  return result;
};

export const saveObservation = (observation: any) => {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Observation (id, patientId, code, display, value, unit, issued)
    VALUES (@id, @patientId, @code, @display, @value, @unit, @issued)
  `);
  stmt.run(observation);
  stmt.free();
};

export const getObservations = (patientId: string) => {
  const db = getDB();
  const stmt = db.prepare("SELECT * FROM Observation WHERE patientId = ? ORDER BY issued DESC");
  const result = stmt.getAsObject([patientId]);
  stmt.free();
  return result;
};

export const saveTask = (task: any) => {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Task (id, patientId, description, status, assignedTo, createdAt, completedAt)
    VALUES (@id, @patientId, @description, @status, @assignedTo, @createdAt, @completedAt)
  `);
  stmt.run(task);
  stmt.free();
};

export const getTasks = (patientId: string) => {
  const db = getDB();
  const stmt = db.prepare("SELECT * FROM Task WHERE patientId = ? ORDER BY createdAt DESC");
  const result = stmt.getAsObject([patientId]);
  stmt.free();
  return result;
};