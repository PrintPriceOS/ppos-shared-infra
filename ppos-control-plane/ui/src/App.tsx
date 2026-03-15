// ppos-control-plane/ui/src/App.tsx
import React, { useState, useEffect } from 'react';
import { ControlPlaneDashboard } from './pages/admin/ControlPlaneDashboard';
import { LoginPage } from './pages/admin/LoginPage';
import { getAuthToken } from './lib/adminApi';
import './index.css';

function App() {
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // In a real app, we might verify this token with a /me endpoint
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setOperator({ name: payload.name, role: payload.role });
      } catch (e) {
        setOperator(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <>
      {operator ? (
        <ControlPlaneDashboard operator={operator} onLogout={() => setOperator(null)} />
      ) : (
        <LoginPage onLogin={(op) => setOperator(op)} />
      )}
    </>
  );
}

export default App;
