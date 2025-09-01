let db: any = null;

// Mock database implementation for development
class MockDatabase {
  private data: Map<string, any[]> = new Map();
  
  exec(sql: string) {
    console.log('Mock DB exec:', sql);
    return [];
  }
  
  run(sql: string, ...params: any[]) {
    console.log('Mock DB run:', sql, params);
    return { lastInsertRowid: 1, changes: 1 };
  }
  
  prepare(sql: string) {
    return {
      run: (...params: any[]) => console.log('Mock DB prepare run:', sql, params),
      get: (...params: any[]) => {
        console.log('Mock DB prepare get:', sql, params);
        return null;
      },
      all: (...params: any[]) => {
        console.log('Mock DB prepare all:', sql, params);
        return [];
      },
      free: () => {}
    };
  }
  
  export() {
    return new Uint8Array();
  }
}

export const initializeDB = async () => {
  try {
    // Use mock database for now
    db = new MockDatabase();
    await createTables();
    console.log('Mock database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const createTables = async () => {
  if (!db) return;
  
  // Patients table
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      thread_id TEXT UNIQUE,
      name TEXT,
      demographics TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      encrypted_data TEXT
    )
  `);
  
  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      role TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      message_type TEXT DEFAULT 'text',
      attachments TEXT,
      fhir_resources TEXT,
      FOREIGN KEY (thread_id) REFERENCES patients (thread_id)
    )
  `);
  
  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      title TEXT,
      description TEXT,
      urgency TEXT,
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (thread_id) REFERENCES patients (thread_id)
    )
  `);
  
  // FHIR Resources table
  db.run(`
    CREATE TABLE IF NOT EXISTS fhir_resources (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      resource_type TEXT,
      resource_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES patients (thread_id)
    )
  `);
  
  // Save to IndexedDB after creating tables
  await saveToIndexedDB();
};

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return db;
};

export const saveToIndexedDB = async () => {
  if (!db) return;
  
  try {
    const data = db.export();
    const request = indexedDB.open('MedThreadDB', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['database'], 'readwrite');
        const store = transaction.objectStore('database');
        store.put(data, 'sqliteDB');
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore('database');
      };
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
  }
};

const loadFromIndexedDB = async (): Promise<Uint8Array | null> => {
  try {
    const request = indexedDB.open('MedThreadDB', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('database')) {
          resolve(null);
          return;
        }
        
        const transaction = database.transaction(['database'], 'readonly');
        const store = transaction.objectStore('database');
        const getRequest = store.get('sqliteDB');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        getRequest.onerror = () => resolve(null);
      };
      
      request.onupgradeneeded = () => {
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    return null;
  }
};

// Auto-save every 30 seconds
setInterval(() => {
  if (db) {
    saveToIndexedDB();
  }
}, 30000);