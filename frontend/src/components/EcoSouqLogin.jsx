import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';

export default function EcoSouqLogin() {
  const { login, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Local UI State
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('buyer'); // 'buyer' | 'vendor'
  const [lang, setLang] = useState('en');
  const ar = lang === 'ar';

  // Fast Login Bypass
  const handleFastLogin = async (demoEmail, demoPassword, targetType) => {
    setIsSubmitLoading(true);
    setErrorMsg('');
    try {
      if (targetType === 'vendor') {
        sessionStorage.setItem('ecoMarketRole', 'seller');
      } else {
        sessionStorage.setItem('ecoMarketRole', 'buyer');
      }
      await login(demoEmail, demoPassword);
      window.location.hash = '#/souq';
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.hash = '#/souq';
    }
  }, [user]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitLoading(true);
    setErrorMsg('');

    try {
      if (userType === 'vendor') {
        sessionStorage.setItem('ecoMarketRole', 'seller');
      } else {
        sessionStorage.setItem('ecoMarketRole', 'buyer');
      }
      await login(email, password);
      window.location.hash = '#/souq';
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
      const targetRole = userType === 'vendor' ? 'farmer' : 'tourist';
      if (userType === 'vendor') {
        sessionStorage.setItem('ecoMarketRole', 'seller');
      } else {
        sessionStorage.setItem('ecoMarketRole', 'buyer');
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
      await login(email, password);
      window.location.hash = '#/souq';
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
      {/* Language toggle */}
      <div className={`absolute top-4 z-10 ${ar ? 'right-4' : 'left-4'}`}>
        <button
          onClick={() => setLang(ar ? 'en' : 'ar')}
          className="px-4 py-1.5 rounded-full border border-[#c2a14e]/60 text-sm font-semibold text-[#9b7a36] bg-white/90 hover:bg-white shadow-sm hover:shadow hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {ar ? 'English' : 'العربية'}
        </button>
      </div>

      {/* Main card container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white/80 border border-white/60 backdrop-blur-xl rounded-3xl shadow-[0_24px_50px_rgba(16,35,27,0.08)] px-10 py-9 hover:shadow-[0_24px_60px_rgba(16,35,27,0.14)] transition-all duration-500">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50/80 flex items-center justify-center border border-emerald-100 shadow-inner">
                <span className="text-3xl">🏬</span>
              </div>
            </div>
            <span className="inline-block text-[9px] font-bold tracking-widest uppercase text-emerald-700 border border-emerald-600/30 rounded-full px-3 py-1 mb-3 bg-emerald-50/50">
              {ar ? 'سوق إيكو المحلي' : 'Eco Souq Local Marketplace'}
            </span>
            <h1 className="text-2xl font-black text-[#16241f] mb-1 tracking-tight">
              SOUQ <span className="text-emerald-650">LOGIN</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium">
              {mode === 'login'
                ? (ar ? 'سجل دخولك لتسوق المنتجات المحلية وإدارة سلتك' : 'Sign in to browse local products & manage your cart')
                : (ar ? 'أنشئ حسابك للانضمام كمتسوق أو بائع محلي' : 'Create your account to join as a buyer or local vendor')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 text-red-600 text-xs bg-red-50/80 border border-red-200 rounded-xl px-4 py-2.5 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          {/* Toggle Login/Signup */}
          <div className="grid grid-cols-2 gap-1 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${mode === 'login' ? 'bg-[#0f7a54] text-white shadow-md' : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              {ar ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${mode === 'signup' ? 'bg-[#0f7a54] text-white shadow-md' : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              {ar ? 'إنشاء حساب' : 'Create Account'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-650 mb-1 uppercase tracking-wider">
                  {ar ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={ar ? 'سالم الكتبي' : 'e.g. Salem Al Ketbi'}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-650 mb-1 uppercase tracking-wider">
                {ar ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@hatta.ae"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-650 mb-1 uppercase tracking-wider">
                {ar ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Account Type Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-650 mb-1.5 uppercase tracking-wider">
                {ar ? 'نوع المستخدم' : 'I want to sign in as:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('buyer')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${userType === 'buyer' ? 'bg-[#0f7a54] text-white border-[#0f7a54]' : 'bg-white text-emerald-700 border-zinc-200 hover:border-emerald-500'}`}
                >
                  🛒 {ar ? 'متسوق / مشترٍ' : 'Buyer / Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('vendor')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${userType === 'vendor' ? 'bg-[#0f7a54] text-white border-[#0f7a54]' : 'bg-white text-emerald-700 border-zinc-200 hover:border-emerald-500'}`}
                >
                  🌾 {ar ? 'بائع / مزارع' : 'Farmer / Vendor'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full py-3 rounded-xl bg-[#0f7a54] hover:bg-[#0b5c3e] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {isSubmitLoading ? (ar ? 'جارٍ التحقق…' : 'Verifying…') : (mode === 'login' ? (ar ? 'تسجيل الدخول' : 'Sign In') : (ar ? 'إنشاء حساب' : 'Create Account'))}
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="mt-6 border-t border-zinc-150 pt-5 text-center">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3">
              {ar ? 'الدخول السريع للتجربة' : 'Quick Demo Access'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFastLogin('tourist@eco.ae', 'tourist123', 'buyer')}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 bg-emerald-50/30 hover:bg-emerald-50 text-[10px] font-bold text-[#0f7a54] transition-all cursor-pointer"
              >
                👤 Login as Guest Buyer
              </button>
              <button
                onClick={() => handleFastLogin('farmer@eco.ae', 'farmer123', 'vendor')}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 bg-emerald-50/30 hover:bg-emerald-50 text-[10px] font-bold text-[#0f7a54] transition-all cursor-pointer"
              >
                🌾 Login as Local Vendor
              </button>
            </div>
            <button
              onClick={() => { window.location.hash = '#/souq'; }}
              className="mt-3 text-[11px] font-bold text-zinc-600 hover:text-emerald-700 underline block mx-auto cursor-pointer"
            >
              {ar ? 'الرجوع إلى السوق العام' : 'Return to Public Souq'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
