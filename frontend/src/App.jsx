import React, { useEffect, useState } from 'react';
import UploadTrackerTab from './components/UploadTrackerTab';
import './styles/App.css';

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if auth token exists in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    } else {
      // In production, redirect to login or show login form
      // For now, we'll use a demo token
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('authToken', demoToken);
      setAuthToken(demoToken);
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">B-Form Upload Tracker</h1>
            <p className="app-subtitle">ASZ One CRM</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-email">{localStorage.getItem('userEmail') || 'User'}</span>
              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem('authToken');
                  setIsAuthenticated(false);
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <UploadTrackerTab authToken={authToken} />
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 ASZ One CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
