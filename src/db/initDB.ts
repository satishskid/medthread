import { FHIR_SCHEMA } from './schema';

// Database types
type DatabaseType = 'sqljs' | 'dexie' | 'mock';

interface DatabaseInstance {
  type: DatabaseType;
  instance: any;
  isReady: boolean;
  lastBackup?: Date;
}

// Global database state
let db: DatabaseInstance | null = null;
let initializationPromise: Promise<any> | null = null;
let isInitializing = false;

// Configuration
const DB_CONFIG = {
  sqljs: {
    wasmUrl: 'https://sql.js.org/dist/',
    maxRetries: 3,
    retryDelay: 1000
  },
  dexie: {
    dbName: 'MedThreadDB',
    version: 2,
    maxRetries: 2,
    retryDelay: 500
  },
  backup: {
    autoBackupInterval: 5 * 60 * 1000, // 5 minutes
    maxBackups: 10
  },
  retry: {
    sqlAttempts: 3,
    dexieAttempts: 2,
    delay: 1000
  }
};

// Enhanced database initialization with retry logic
export const initializeDB = async (): Promise<any> => {
  if (db?.isReady) {
    console.log('📊 Database already initialized:', db.type);
    return db.instance;
  }

  if (isInitializing && initializationPromise) {
    console.log('⏳ Database initialization in progress...');
    return initializationPromise;
  }

  isInitializing = true;
  const errors: Array<{ strategy: string; error: any }> = [];

  try {
    // Strategy 1: SQL.js (WASM SQLite)
    for (let attempt = 1; attempt <= DB_CONFIG.retry.sqlAttempts; attempt++) {
      try {
        console.log(`🔄 Attempting SQL.js initialization (${attempt}/${DB_CONFIG.retry.sqlAttempts})...`);
        
        // Try SQL.js import with fallback
         let SQL;
         try {
           const sqlModule = await import('sql.js') as any;
           const initSqlJs = sqlModule.default || sqlModule;
           if (typeof initSqlJs === 'function') {
             SQL = await initSqlJs({
               locateFile: (file: string) => `https://sql.js.org/dist/${file}`
             });
           } else {
             throw new Error('initSqlJs is not a function');
           }
         } catch (importError) {
           console.warn('⚠️ SQL.js import failed:', importError);
           throw importError;
         }

        let database;
        
        // Try to restore from backup first
        try {
          const backupData = await loadFromIndexedDB();
          if (backupData && backupData.length > 0) {
            database = new SQL.Database(backupData);
            console.log('📦 Restored database from backup');
          }
        } catch (backupError) {
          console.warn('⚠️ Backup restore failed:', backupError);
        }
        
        // Create new database if restore failed
        if (!database) {
          database = new SQL.Database();
          database.exec(FHIR_SCHEMA);
          console.log('🆕 Created new database with schema');
        }

        db = {
          type: 'sqljs',
          instance: database,
          isReady: true,
          lastBackup: new Date()
        };
        
        // Start auto-backup
        startAutoBackup();
        
        // Validate integrity
        validateDatabaseIntegrity(database);
        
        console.log('✅ SQL.js database initialized successfully');
        return database;
        
      } catch (err) {
        errors.push({ strategy: 'SQL.js', error: err });
        console.error(`❌ SQL.js attempt ${attempt} failed:`, err);
        
        if (attempt < DB_CONFIG.retry.sqlAttempts) {
          await new Promise(resolve => setTimeout(resolve, DB_CONFIG.retry.delay));
        }
      }
    }

    // Strategy 2: Dexie.js fallback
    if (!db?.instance) {
      for (let attempt = 1; attempt <= DB_CONFIG.retry.dexieAttempts; attempt++) {
        try {
          console.log(`🔄 Attempting Dexie.js initialization (${attempt}/${DB_CONFIG.retry.dexieAttempts})...`);
          
          const { default: Dexie } = await import('dexie');
          const dexieDB = new Dexie('MedThreadDB');
          
          dexieDB.version(2).stores({
            patients: 'id, name, birthDate, gender, active, lastUpdated',
            observations: 'id, patientId, code, value, issued, status, category',
            encounters: 'id, patientId, status, class, period, reasonCode',
            documents: 'id, patientId, type, content, created, size',
            tasks: 'id, patientId, status, intent, description, authoredOn'
          });
          
          await dexieDB.open();
          
          // Create SQL.js-compatible wrapper
          const dexieWrapper = {
            exec: async (sql: string, params: any[] = []) => {
              return await executeDexieQuery(dexieDB, sql, params);
            },
            run: async (sql: string, params: any[] = []) => {
              return await executeDexieQuery(dexieDB, sql, params, true);
            },
            get: async (sql: string, params: any[] = []) => {
              return await executeDexieQuery(dexieDB, sql, params, true);
            },
            all: async (sql: string, params: any[] = []) => {
              return await executeDexieQuery(dexieDB, sql, params);
            },
            export: () => {
              console.log('📊 Dexie.js export requested (not implemented)');
              return new Uint8Array();
            },
            close: () => {
              dexieDB.close();
            }
          };
          
          db = {
            type: 'dexie',
            instance: dexieWrapper,
            isReady: true,
            lastBackup: undefined
          };
          
          console.log('✅ Dexie.js database initialized successfully');
          return dexieWrapper;
          
        } catch (err) {
          errors.push({ strategy: 'Dexie.js', error: err });
          console.error(`❌ Dexie.js attempt ${attempt} failed:`, err);
          
          if (attempt < DB_CONFIG.retry.dexieAttempts) {
            await new Promise(resolve => setTimeout(resolve, DB_CONFIG.retry.delay));
          }
        }
      }
    }

    // Strategy 3: Mock database fallback
    if (!db?.instance) {
      console.warn('⚠️ Using mock database as final fallback');
      
      const mockData = {
        patients: [
          {
            id: 'patient-demo-001',
            name: 'John Doe',
            birthDate: '1985-03-15',
            gender: 'male',
            active: 1,
            lastUpdated: new Date().toISOString()
          }
        ],
        observations: [
          {
            id: 'obs-demo-001',
            patientId: 'patient-demo-001',
            code: 'blood-pressure',
            value: '120/80 mmHg',
            issued: new Date().toISOString(),
            status: 'final',
            category: 'vital-signs'
          }
        ],
        encounters: [],
        documents: [],
        tasks: []
      };
      
      const mockDB = {
        exec: (sql: string, params: any[] = []) => {
          console.log('🔍 Mock DB exec:', sql.substring(0, 50) + '...');
          return [];
        },
        run: (sql: string, params: any[] = []) => {
          console.log('🔍 Mock DB run:', sql.substring(0, 50) + '...');
          return { lastInsertRowid: Date.now() };
        },
        get: (sql: string, params: any[] = []) => {
          console.log('🔍 Mock DB get:', sql.substring(0, 50) + '...');
          if (sql.toLowerCase().includes('patients')) {
            return mockData.patients[0] || null;
          }
          return null;
        },
        all: (sql: string, params: any[] = []) => {
          console.log('🔍 Mock DB all:', sql.substring(0, 50) + '...');
          if (sql.toLowerCase().includes('patients')) {
            return mockData.patients;
          }
          if (sql.toLowerCase().includes('observations')) {
            return mockData.observations;
          }
          return [];
        },
        export: () => {
          return new TextEncoder().encode(JSON.stringify(mockData));
        },
        close: () => {
          console.log('🔍 Mock DB closed');
        }
      };
      
      db = {
          type: 'mock',
          instance: mockDB,
          isReady: true,
          lastBackup: undefined
        };
      
      return mockDB;
    }

    console.log(`🎯 Database initialized with ${db.type} strategy`);
    
    if (errors.length > 0) {
      console.warn('⚠️ Initialization errors encountered:', errors);
    }
    
    return db.instance;
    
  } catch (error) {
    console.error('💥 Critical database initialization failure:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

// Helper function to validate database integrity
const validateDatabaseIntegrity = (database: any): void => {
  try {
    const tables = database.exec("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tables[0]?.values?.map((row: any[]) => row[0]) || [];
    
    const requiredTables = ['patients', 'observations', 'encounters', 'documents', 'tasks'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️ Missing database tables:', missingTables);
    } else {
      console.log('✅ Database integrity validated');
    }
  } catch (error) {
    console.warn('⚠️ Database integrity check failed:', error);
  }
};

// Helper function to execute Dexie queries with SQL-like interface
const executeDexieQuery = async (dexieDB: any, sql: string, params: any[] = [], returnFirst = false): Promise<any> => {
  const sqlLower = sql.toLowerCase().trim();
  
  try {
    // INSERT operations
    if (sqlLower.startsWith('insert into patients')) {
      const patientData = parseInsertParams('patients', params);
      const id = await dexieDB.patients.add(patientData);
      return { lastInsertRowid: id };
    }
    
    if (sqlLower.startsWith('insert into observations')) {
      const observationData = parseInsertParams('observations', params);
      const id = await dexieDB.observations.add(observationData);
      return { lastInsertRowid: id };
    }
    
    // SELECT operations
    if (sqlLower.startsWith('select') && sqlLower.includes('from patients')) {
      const results = await dexieDB.patients.toArray();
      return returnFirst ? (results[0] || null) : results;
    }
    
    if (sqlLower.startsWith('select') && sqlLower.includes('from observations')) {
      const results = await dexieDB.observations.toArray();
      return returnFirst ? (results[0] || null) : results;
    }
    
    console.log('📊 Unhandled Dexie query:', sql.substring(0, 100) + '...');
    return returnFirst ? null : [];
    
  } catch (error) {
    console.error('❌ Dexie query execution failed:', error);
    throw error;
  }
};

// Helper function to parse INSERT parameters
const parseInsertParams = (tableName: string, params: any[]): any => {
  switch (tableName) {
    case 'patients':
      return {
        id: params[0] || 'patient-' + Date.now(),
        name: params[1] || 'Unknown Patient',
        birthDate: params[2] || '1990-01-01',
        gender: params[3] || 'unknown',
        active: params[4] !== undefined ? params[4] : 1,
        lastUpdated: new Date().toISOString()
      };
      
    case 'observations':
      return {
        id: params[0] || 'obs-' + Date.now(),
        patientId: params[1] || 'unknown',
        code: params[2] || 'unknown',
        value: params[3] || '',
        issued: params[4] || new Date().toISOString(),
        status: params[5] || 'final',
        category: params[6] || 'vital-signs'
      };
      
    default:
      const data: any = {};
      params.forEach((param, index) => {
        data[`field_${index}`] = param;
      });
      return data;
  }
};

// Auto-backup functionality for SQL.js
let backupInterval: NodeJS.Timeout | null = null;

const startAutoBackup = (): void => {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  backupInterval = setInterval(async () => {
    try {
      if (db?.type === 'sqljs' && db.instance) {
        const data = db.instance.export();
        await saveToIndexedDB(data);
        db.lastBackup = new Date();
        console.log('💾 Auto-backup completed');
      }
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
    }
  }, DB_CONFIG.backup.autoBackupInterval);
  
  console.log('⏰ Auto-backup started');
};

// Stop auto-backup
const stopAutoBackup = (): void => {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('⏹️ Auto-backup stopped');
  }
};

// Database access
export const getDB = () => {
  if (!db?.isReady) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return db.instance;
};

// IndexedDB backup functions
export const saveToIndexedDB = async (data: Uint8Array) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('MedThreadBackup', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      
      const backupData = {
        id: 'latest',
        data: data,
        timestamp: new Date().toISOString()
      };
      
      const putRequest = store.put(backupData);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }
    };
  });
};

export const loadFromIndexedDB = async (): Promise<Uint8Array | null> => {
  return new Promise<Uint8Array | null>((resolve, reject) => {
    const request = indexedDB.open('MedThreadBackup', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('backups')) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(['backups'], 'readonly');
      const store = transaction.objectStore('backups');
      const getRequest = store.get('latest');
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result ? result.data : null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }
    };
  });
};