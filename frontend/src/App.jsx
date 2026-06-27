import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { API_BASE } from './config';
import ProtectedRoute from './components/ProtectedRoute';
import FarmerPortal from './portals/FarmerPortal';
import AdminPortal from './portals/AdminPortal';
import TouristPortal from './portals/TouristPortal';
import InvestorPortal from './portals/InvestorPortal';
import EmployeePortal from './portals/EmployeePortal';
import TraceabilityView from './components/TraceabilityView';
import AccessibilityPanel from './components/AccessibilityPanel';
import SmartDocumentVerification from './components/SmartDocumentVerification';
import EcoSouqWebsite from './components/EcoSouqWebsite';
import MobileAppSimulator from './components/MobileAppSimulator';
import EcoSouqLogin from './components/EcoSouqLogin';

// ==========================================================================
// LOGIN VIEW COMPONENT
// ==========================================================================
function Login() {
  const { login, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sign-up / create-account state
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('farmer');

  // Smart AI onboarding (document verification) shown after sign-up
  const [onboarding, setOnboarding] = useState(null); // { role, token, name } | null

  // MOE-strategist style UI state
  const [lang, setLang] = useState('en'); // 'en' | 'ar'
  const ar = lang === 'ar';

  const switchMode = (next) => {
    setMode(next);
    setErrorMsg('');
  };

  // Fast Login Bypass
  const handleFastLogin = async (demoEmail, demoPassword) => {
    setIsSubmitLoading(true);
    setErrorMsg('');
    try {
      const role = await login(demoEmail, demoPassword);
      redirectUser(role);
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Seller shortcut — logs in as a farmer and opens the Eco Market directly in Seller mode
  const handleSellerLogin = async () => {
    try {
      sessionStorage.setItem('ecoMarketRole', 'seller');
    } catch { /* sessionStorage unavailable */ }
    await handleFastLogin('farmer@eco.ae', 'farmer123');
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
  }, [user]);

  const redirectUser = (role) => {
    if (role === 'farmer') window.location.hash = '#/farmer';
    else if (role === 'admin') window.location.hash = '#/admin';
    else if (role === 'tourist') window.location.hash = '#/tourist';
    else if (role === 'investor') window.location.hash = '#/investor';
    else if (role === 'employee') window.location.hash = '#/employee';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitLoading(true);
    setErrorMsg('');
    
    try {
      const role = await login(email, password);
      redirectUser(role);
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    setIsSubmitLoading(true);
    setErrorMsg('');

    try {
      const targetRole = role === 'seller' ? 'farmer' : role;
      if (role === 'seller') {
        try {
          sessionStorage.setItem('ecoMarketRole', 'seller');
        } catch {}
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password, role: targetRole }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || 'Registration failed.');
      }
      // Auto-login the new account
      const userRole = await login(email, password);
      // Show Smart AI onboarding (document verification) before entering the portal.
      const freshToken = localStorage.getItem('eco_token');
      setOnboarding({ role: userRole, token: freshToken, name: fullName });
    } catch (err) {
      setErrorMsg(err.message || 'Could not create account.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-zinc-950"
      style={{ direction: ar ? 'rtl' : 'ltr' }}
    >
      {/* Smart AI onboarding overlay — shown right after a new account is created */}
      {onboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ direction: 'ltr' }}>
          <SmartDocumentVerification
            token={onboarding.token}
            userName={onboarding.name}
            onComplete={() => {
              const r = onboarding.role;
              setOnboarding(null);
              redirectUser(r);
            }}
          />
        </div>
      )}

      {/* Language toggle */}
      <div className={`absolute top-4 z-10 ${ar ? 'right-4' : 'left-4'}`}>
        <button
          onClick={() => setLang(ar ? 'en' : 'ar')}
          className="px-4 py-1.5 rounded-full border border-[#c2a14e]/60 text-sm font-semibold text-[#9b7a36] bg-white/90 hover:bg-white shadow-sm hover:shadow hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {ar ? 'English' : 'العربية'}
        </button>
      </div>

      {/* Centre card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[430px] bg-white/80 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_24px_50px_rgba(166,128,43,0.08)] px-10 py-9 hover:shadow-[0_24px_60px_rgba(166,128,43,0.14)] transition-all duration-500">
          {/* Brand header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-[#f5f0e8]/80 flex items-center justify-center border border-[#e8dcc8] shadow-inner transform hover:rotate-6 transition-transform duration-300">
                <img src="/logo.svg" alt="Eco Connect" className="w-12 h-12" />
              </div>
            </div>
            <span className="inline-block text-[9px] font-bold tracking-widest uppercase text-[#9b7a36] border border-[#c2a14e]/40 rounded-full px-3 py-1 mb-3 bg-[#faf6ec]/50">
              {ar ? 'وزارة التغير المناخي والبيئة' : 'Ministry of Climate Change & Environment'}
            </span>
            <h1 className="text-3xl font-black text-[#1a1208] mb-1 tracking-tight">
              ECO <span className="text-[#1e3a8a]">CONNECT</span>
            </h1>
            <p className="text-xs text-[#9b7a36] font-medium leading-relaxed">
              {mode === 'login'
                ? (ar ? 'لتجربة مخصصة، يرجى تسجيل الدخول.' : 'For a personalised experience, please sign in.')
                : (ar ? 'أنشئ حسابك للانضمام إلى المنصة.' : 'Create your account to join the platform.')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 text-red-600 text-xs bg-red-50/80 border border-red-200 rounded-xl px-4 py-2.5 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          {/* Login / Sign-up toggle */}
          <div className="grid grid-cols-2 gap-1 bg-[#faf6ec]/65 border border-[#e0d8cc] rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${mode === 'login' ? 'bg-[#1a1208] text-white shadow-md' : 'text-[#9b7a36] hover:text-[#7a6030]'}`}
            >
              {ar ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${mode === 'signup' ? 'bg-[#1a1208] text-white shadow-md' : 'text-[#9b7a36] hover:text-[#7a6030]'}`}
            >
              {ar ? 'إنشاء حساب' : 'Create Account'}
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@eco.ae"
                  className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white/60 text-[#1a1208] text-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a36]/40 focus:border-[#9b7a36] placeholder:text-[#c2a14e]/50 hover:border-[#9b7a36]/40 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white/60 text-[#1a1208] text-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a36]/40 focus:border-[#9b7a36] hover:border-[#9b7a36]/40 transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full py-3 rounded-xl bg-[#1a1208] hover:bg-[#2a1e0a] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-300 cursor-pointer disabled:opacity-60"
              >
                {isSubmitLoading ? (ar ? 'جارٍ التحقق…' : 'Verifying…') : (ar ? 'تسجيل الدخول' : 'Sign In')}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <span className="flex-1 h-px bg-[#e8dcc8]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#c2a14e]">{ar ? 'أو' : 'or'}</span>
                <span className="flex-1 h-px bg-[#e8dcc8]" />
              </div>

              {/* UAE PASS */}
              <button
                type="button"
                onClick={() => handleFastLogin('farmer@eco.ae', 'farmer123')}
                disabled={isSubmitLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#e0d8cc] bg-white hover:bg-[#faf6ec] transition-all text-sm font-semibold text-[#1a1208] shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 duration-300 cursor-pointer disabled:opacity-60"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-[#e0d8cc] flex-shrink-0">
                  <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
                    <circle cx="20" cy="20" r="20" fill="white" />
                    <path d="M20 6 A14 14 0 0 1 34 20" stroke="#00a651" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M34 20 A14 14 0 0 1 20 34" stroke="#000000" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M20 34 A14 14 0 0 1 6 20" stroke="#ef3340" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M6 20 A14 14 0 0 1 20 6" stroke="#ef3340" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <circle cx="20" cy="20" r="5" fill="#1a1208" />
                  </svg>
                </span>
                {ar ? 'تسجيل الدخول عبر الهوية الرقمية' : 'Sign in with UAE PASS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={ar ? 'مثال: سالم الحطاوي' : 'e.g. Salem Al Hattawi'}
                  className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white/60 text-[#1a1208] text-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a36]/40 focus:border-[#9b7a36] placeholder:text-[#c2a14e]/50 hover:border-[#9b7a36]/40 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.ae"
                  className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white/60 text-[#1a1208] text-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a36]/40 focus:border-[#9b7a36] placeholder:text-[#c2a14e]/50 hover:border-[#9b7a36]/40 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={ar ? 'أنشئ كلمة مرور' : 'Create a password'}
                  className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white/60 text-[#1a1208] text-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a36]/40 focus:border-[#9b7a36] hover:border-[#9b7a36]/40 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a3728] mb-1.5 uppercase tracking-wider">
                  {ar ? 'نوع الحساب' : 'Account Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'farmer', label: ar ? '🌾 مزارع' : '🌾 Farmer' },
                    { id: 'seller', label: ar ? '🏷️ بائع' : '🏷️ Seller' },
                    { id: 'tourist', label: ar ? '🐫 سائح' : '🐫 Tourist' },
                    { id: 'admin', label: ar ? '🏛️ مشرف' : '🏛️ Admin' },
                    { id: 'investor', label: ar ? '💼 مستثمر' : '💼 Investor' },
                    { id: 'employee', label: ar ? '👷 موظف' : '👷 Employee' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${role === r.id ? 'bg-[#1a1208] text-white border-[#1a1208]' : 'bg-white/80 text-[#9b7a36] border-[#e0d8cc] hover:border-[#9b7a36] hover:bg-[#faf6ec]'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full py-3 rounded-xl bg-[#1a1208] hover:bg-[#2a1e0a] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-300 cursor-pointer disabled:opacity-60"
              >
                {isSubmitLoading ? (ar ? 'جارٍ الإنشاء…' : 'Creating Account…') : (ar ? 'إنشاء حساب' : 'Create Account')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom quick-access buttons */}
      {mode === 'login' && (
        <div className="flex flex-wrap justify-center gap-3 pb-10 px-4">
          <button
            onClick={handleSellerLogin}
            disabled={isSubmitLoading}
            className="px-6 py-3 rounded-full border border-[#247055]/50 text-xs font-bold text-white bg-[#247055] hover:bg-[#1b5a43] transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {ar ? '🏷️ تسجيل الدخول كبائع' : '🏷️ LOGIN AS A SELLER'}
          </button>
          <button
            onClick={() => handleFastLogin('farmer@eco.ae', 'farmer123')}
            disabled={isSubmitLoading}
            className="px-6 py-3 rounded-full border border-[#c2a14e]/40 text-xs font-semibold text-[#4a3728] bg-white/90 backdrop-blur-sm hover:bg-[#1a1208] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {ar ? '🌾 الدخول كمزارع' : '🌾 CONTINUE AS FARMER'}
          </button>
          <button
            onClick={() => handleFastLogin('admin@eco.ae', 'admin123')}
            disabled={isSubmitLoading}
            className="px-6 py-3 rounded-full border border-[#c2a14e]/40 text-xs font-semibold text-[#4a3728] bg-white/90 backdrop-blur-sm hover:bg-[#1a1208] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {ar ? '🏛️ الدخول كمشرف' : '🏛️ CONTINUE AS ADMIN'}
          </button>
          <button
            onClick={() => handleFastLogin('tourist@eco.ae', 'tourist123')}
            disabled={isSubmitLoading}
            className="px-6 py-3 rounded-full border border-[#c2a14e]/40 text-xs font-semibold text-[#4a3728] bg-white/90 backdrop-blur-sm hover:bg-[#1a1208] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {ar ? '🐫 الدخول كسائح' : '🐫 CONTINUE AS TOURIST'}
          </button>
          <button
            onClick={() => { window.location.hash = '#/souq'; }}
            className="px-6 py-3 rounded-full border border-emerald-500/50 text-xs font-bold text-white bg-emerald-700/80 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            {ar ? '🏬 سوق إيكو العام' : '🏬 BROWSE PUBLIC ECO SOUQ'}
          </button>
          <button
            onClick={() => { window.location.hash = '#/mobile'; }}
            className="px-6 py-3 rounded-full border border-purple-500/40 text-xs font-bold text-white bg-purple-700/80 hover:bg-purple-650 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider animate-pulse"
          >
            {ar ? '📱 محاكي الهاتف' : '📱 VINCENT MOBILE APP'}
          </button>
        </div>
      )}

      {/* Partner Access — Investor & Employee sign-in */}
      {mode === 'login' && (
        <div className="pb-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-1 h-px bg-[#c2a14e]/30" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9b7a36]">
                {ar ? 'دخول الشركاء' : 'Partner Access'}
              </span>
              <span className="flex-1 h-px bg-[#c2a14e]/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFastLogin('investor@eco.ae', 'investor123')}
                disabled={isSubmitLoading}
                className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-2xl border border-[#9b7a36]/40 bg-gradient-to-b from-[#fdf8ec] to-[#f5ead0] hover:from-[#1a1208] hover:to-[#2a1e0a] text-[#4a3728] hover:text-amber-200 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 group"
              >
                <span className="text-2xl">💼</span>
                <span className="text-xs font-bold uppercase tracking-wide">{ar ? 'دخول المستثمر' : 'Investor Sign In'}</span>
                <span className="text-[9px] text-[#9b7a36] group-hover:text-amber-300/70">{ar ? 'فرص التمويل' : 'Funding opportunities'}</span>
              </button>
              <button
                onClick={() => handleFastLogin('employee@eco.ae', 'employee123')}
                disabled={isSubmitLoading}
                className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-2xl border border-[#247055]/40 bg-gradient-to-b from-[#eef7f1] to-[#dcefdf] hover:from-[#0f2b1f] hover:to-[#143a28] text-[#1b5a43] hover:text-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 group"
              >
                <span className="text-2xl">👷</span>
                <span className="text-xs font-bold uppercase tracking-wide">{ar ? 'دخول الموظف' : 'Employee Sign In'}</span>
                <span className="text-[9px] text-[#247055] group-hover:text-emerald-300/70">{ar ? 'المهام والرواتب' : 'Tasks & payslips'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// CORE APP ROUTER ENTRYPOINT
// ==========================================================================
export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/login');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#/login');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderRoute = () => {
    // Public traceability scan page (reached by scanning a product QR code) — no auth.
    if (hash.startsWith('#/trace/')) {
      const publicId = hash.slice('#/trace/'.length);
      return <TraceabilityView publicId={publicId} />;
    }

    // Hash Navigation Mapping
    switch (hash) {
      case '#/farmer':
        return (
          <ProtectedRoute allowedRoles={['farmer', 'admin']}>
            <FarmerPortal />
          </ProtectedRoute>
        );
      case '#/admin':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPortal />
          </ProtectedRoute>
        );
      case '#/tourist':
        return (
          <ProtectedRoute allowedRoles={['tourist', 'admin']}>
            <TouristPortal />
          </ProtectedRoute>
        );
      case '#/investor':
        return (
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <InvestorPortal />
          </ProtectedRoute>
        );
      case '#/employee':
        return (
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <EmployeePortal />
          </ProtectedRoute>
        );
      case '#/souq':
        return <EcoSouqWebsite />;
      case '#/souq/login':
        return <EcoSouqLogin />;
      case '#/mobile':
        return <MobileAppSimulator />;
      case '#/login':
      default:
        return <Login />;
    }
  };

  return (
    <>
      {renderRoute()}
      <AccessibilityPanel />
    </>
  );
}
