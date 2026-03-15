// ppos-control-plane/ui/src/pages/admin/LoginPage.tsx
import React, { useState } from 'react';
import { ShieldCheckIcon, UserIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { login } from '../../lib/adminApi';

interface LoginPageProps {
  onLogin: (operator: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);

  const handleSSOLogin = () => {
    // In a real OIDC flow, this would redirect to the IdP
    // For this phase, we mock the handoff or provide a hint
    alert("Redirecting to OIDC Identity Provider (Phase 19.B.1)...\n\nIn a production environment, this would navigate to the PPOS Identity Service.");
    
    // For Dev/Demo: simulate an OIDC callback by just using the current mock login
    handleLogin(null, "admin", "ppos2026");
  };

  const handleLogin = async (e: React.FormEvent | null, u?: string, p?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(u || username, p || password);
      onLogin(data.operator);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-slate-800 rounded-2xl shadow-2xl mb-6 ring-1 ring-slate-700">
            <ShieldCheckIcon className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">PPOS Control Plane</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Governance Identity Gate</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
          <div className="mb-8">
            <h2 className="text-white text-lg font-bold mb-1">Authenticated Entry Only</h2>
            <p className="text-slate-400 text-xs font-medium">Access to the industrial governance surface is restricted to authorized platform operators.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Primary SSO Action */}
            <button
              onClick={handleSSOLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <GlobeAltIcon className="w-5 h-5" />
              {loading ? 'Authenticating...' : 'Login with PPOS SSO'}
            </button>

            <div className="flex items-center gap-4 my-6 py-2">
                <div className="h-px bg-slate-700 grow" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or</span>
                <div className="h-px bg-slate-700 grow" />
            </div>

            {/* Legacy Fallback */}
            {!showLegacy ? (
                <button 
                    onClick={() => setShowLegacy(true)}
                    className="w-full text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest p-2 transition-colors"
                >
                    Emergency Admin Access
                </button>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-1">
                    <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                        type="text"
                        placeholder="Operator ID"
                        className="w-full bg-slate-900 border-none text-white p-4 pl-12 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        />
                    </div>
                    </div>

                    <div className="space-y-1">
                    <div className="relative group">
                        <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                        type="password"
                        placeholder="Security Pin"
                        className="w-full bg-slate-900 border-none text-white p-4 pl-12 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-slate-900 p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Authenticate'}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setShowLegacy(false)}
                        className="w-full text-slate-500 hover:text-slate-400 text-[9px] font-bold uppercase tracking-widest transition-colors"
                    >
                        Cancel Legacy Login
                    </button>
                </form>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] leading-loose">
            By authenticating, you acknowledge that all actions are explicitly<br/>
            attributed to your identity and stored in the PPOS Governance Ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
