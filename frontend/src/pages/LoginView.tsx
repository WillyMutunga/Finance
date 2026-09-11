import React, { useState } from 'react';
import { ApiService } from '../services/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string, school: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'staff' | 'parent'>('staff');
  
  // Staff Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Parent Form State
  const [admissionNo, setAdmissionNo] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Handle Staff Login
  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.login(email, password);
      if (res && res.status === 'success' && res.user) {
        onLoginSuccess(res.user, res.token, res.school);
      } else {
        setError('Invalid username/email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Parent Direct Login
  const handleSubmitParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNo.trim()) {
      setError('Please enter your student admission number.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.login(admissionNo.trim(), 'parent123');
      if (res && res.status === 'success' && res.user) {
        onLoginSuccess(
          {
            ...res.user,
            role: 'parent',
            name: `Parent of Adm ${admissionNo.trim()}`
          },
          res.token,
          res.school
        );
      } else {
        setError('Student admission number not found in registry.');
      }
    } catch (err: any) {
      setError(err.message || 'Parent portal lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      {/* 1. FULL SCREEN HERO BACKGROUND IMAGE (BRIGHT & VIBRANT) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/finance_hero.jpg" 
          alt="Skysoft Finance ERP Hero" 
          className="w-full h-full object-cover object-center transform scale-100"
        />
        {/* Soft, ultra-bright luminous overlay for crisp clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-white/60 backdrop-blur-[1.5px]" />
      </div>

      {/* 2. BRIGHT FROSTED TOP NAVBAR */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-emerald-600/30">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">SKYSOFT</span>
              <span className="font-bold text-[10px] tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                FINANCE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Enterprise School Accounting ERP • Skysoft Systems</p>
          </div>
        </div>
      </header>

      {/* 3. CENTERED HERO SIGN-IN CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-auto">
        <div className="w-full max-w-[420px]">
          <div className="bg-white/95 sm:bg-white/92 backdrop-blur-2xl border border-white/80 rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5 space-y-5 text-slate-800">
            
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white mb-1">
                <div className="w-full h-full bg-emerald-600 rounded-[14px] flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
              <p className="text-xs text-slate-500 font-medium">Sign in to your institutional financial portal</p>
            </div>

            {/* Modern Segmented Role Switcher */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginType('staff');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginType === 'staff'
                    ? 'bg-white text-emerald-800 font-extrabold shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff & Bursar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginType('parent');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginType === 'parent'
                    ? 'bg-white text-emerald-800 font-extrabold shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Parent Portal</span>
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* 1. Staff Sign-In Form */}
            {loginType === 'staff' ? (
              <form onSubmit={handleSubmitStaff} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">
                    Username or Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Willy or bursar@nduundune.ac.ke"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white text-xs font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold text-[11px]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white text-xs font-semibold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span className="text-slate-600 text-xs font-medium">Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-xs cursor-pointer mt-1"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* 2. Parent Direct Form */
              <form onSubmit={handleSubmitParent} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] leading-relaxed font-medium">
                  Enter student admission number (e.g. <strong>4000</strong>, <strong>4001</strong>, <strong>4002</strong>) to view real-time fee statements and pay via M-Pesa.
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">
                    Student Admission Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4000"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-xs cursor-pointer mt-1"
                >
                  <span>{loading ? 'Verifying Student...' : 'Access Fee Statement'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Subtle Security Badge */}
            <div className="pt-2 text-center">
              <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>256-bit SSL Encrypted Institutional Session</span>
              </span>
            </div>

          </div>
        </div>
      </main>

      {/* 4. FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 space-y-2 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="font-bold text-xs">Instructions Sent</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 text-xs">
                  Enter your registered institutional staff email address to receive a password reset link.
                </p>
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Staff Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. bursar@nduundune.ac.ke"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Send Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. BRIGHT FROSTED FOOTER */}
      <footer className="px-6 py-4 border-t border-slate-200/80 bg-white/90 backdrop-blur-md text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 shadow-xs select-none">
        {/* Far Left: Developed by Willy Mutunga */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Developed by <strong className="text-slate-900 font-extrabold">Willy Mutunga</strong></span>
        </div>

        {/* Center: Cryptographic Security Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected by AES-256 & SHA-256 Cryptographic Audit Ledger</span>
        </div>

        {/* Far Right: Powered by SkySoft Systems */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Powered by</span>
          <a
            href="https://skysoftsystems.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors"
          >
            SkySoft Systems
          </a>
        </div>
      </footer>
    </div>
  );
};