import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Onboarding } from './pages/Onboarding';
import { initializeDB } from './db/initDB';
import { initWebLLM } from './ai/webllmClient';
import { savePatient } from './db/queries';
import './index.css';

// Load license config
const licenseConfig = localStorage.getItem('licenseConfig');
const showOnboarding = !licenseConfig;

// Initialize application
async function initializeApp() {
  try {
    // Initialize database with retry logic
    console.log('🔄 Initializing database...');
    await initializeDB();
    console.log('✅ Database initialized');

    // Initialize WebLLM in background
    initWebLLM().catch(err => {
      console.warn('WebLLM initialization failed:', err);
    });

    // Create default patient if none exists
    try {
      await savePatient({
        id: 'default-patient',
        resourceType: 'Patient',
        name: { given: ['John'], family: 'Doe' },
        birthDate: '1980-01-01',
        gender: 'male'
      });
      console.log('✅ Default patient created');
    } catch (err) {
      // Patient might already exist, ignore error
    }

    // Render React app
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        {showOnboarding ? <Onboarding /> : <App />}
      </React.StrictMode>
    );
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // Render with error state or fallback
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Initialization Error</h2>
          <p>Failed to initialize the application. Please refresh the page.</p>
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
        </div>
      </React.StrictMode>
    );
  }
}

initializeApp();