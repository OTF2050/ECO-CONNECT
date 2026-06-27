import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></span>
        <p className="text-xs uppercase font-mono tracking-widest">Validating Eco Session...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login hash page
  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  // Check roles
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900/60 border border-red-500/20 p-8 rounded-2xl text-center backdrop-blur-md">
          <span className="text-5xl block mb-4">🚨</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Your Eco Connect profile role (<span className="text-emerald-400 font-mono">{user.role}</span>) does not possess authority to view this administrative sector.
          </p>
          <button
            onClick={() => {
              if (user.role === 'farmer') window.location.hash = '#/farmer';
              else if (user.role === 'admin') window.location.hash = '#/admin';
              else if (user.role === 'tourist') window.location.hash = '#/tourist';
              else if (user.role === 'investor') window.location.hash = '#/investor';
              else if (user.role === 'employee') window.location.hash = '#/employee';
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-200 py-2.5 rounded-xl text-xs font-semibold border border-zinc-750 transition-all"
          >
            Return to Authorized Portal
          </button>
        </div>
      </div>
    );
  }

  return children;
}
