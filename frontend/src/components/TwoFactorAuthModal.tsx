import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, ArrowRight, RotateCw, AlertCircle, X, KeyRound, Sparkles } from 'lucide-react';
import { ApiService } from '../services/api';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  tempToken: string;
  maskedEmail: string;
  userPreview?: { name?: string; role?: string };
  debugOtp?: string;
  onSuccess: (authData: { user: any; school: any; token: string }) => void;
  onCancel: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  tempToken,
  maskedEmail,
  userPreview,
  debugOtp,
  onSuccess,
  onCancel
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [localDebugOtp, setLocalDebugOtp] = useState<string | undefined>(debugOtp);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError(null);
      setResendMessage(null);
      setLocalDebugOtp(debugOtp);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen, debugOtp]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      // Pasted full OTP code
      const digits = value.slice(0, 6).split('');
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (digits.length === 6) {
        submitOtp(newOtp.join(''));
      }
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit on last digit
    if (index === 5 && value && newOtp.every(d => d !== '')) {
      submitOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    if (code.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await ApiService.verify2FA(tempToken, code);
      if (res && res.status === 'success') {
        onSuccess({
          user: res.user,
          school: res.school,
          token: res.token
        });
      } else {
        setError(res.message || 'Invalid verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      const res = await ApiService.resend2FA(tempToken);
      if (res && res.status === 'success') {
        setResendMessage('A new verification code has been dispatched to your email.');
        if (res.debug_otp) {
          setLocalDebugOtp(res.debug_otp);
        }
        setResendCooldown(45);
      }
    } catch (err: any) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const fillDebugOtp = () => {
    if (localDebugOtp && localDebugOtp.length === 6) {
      const digits = localDebugOtp.split('');
      setOtp(digits);
      submitOtp(localDebugOtp);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden text-slate-800 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="bg-gradient-to-br from-sky-600 via-emerald-600 to-teal-700 p-7 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <ShieldCheck className="w-8 h-8 text-white drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Two-Factor Security</h3>
          <p className="text-xs text-white/90 mt-1 font-medium">Verify your registered email account to proceed</p>
        </div>

        {/* Content Body */}
        <div className="p-7 space-y-5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="text-slate-500 font-medium">Verification code sent to:</p>
              <p className="font-extrabold text-slate-900 font-mono text-sm tracking-tight">{maskedEmail}</p>
            </div>
          </div>

          {/* 6-Digit OTP Inputs */}
          <div className="space-y-2">
            <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-500">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-11 h-13 text-center text-xl font-mono font-black rounded-xl border transition-all outline-none ${
                    digit
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-xs'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Developer Testing Fast-Fill Banner */}
          {localDebugOtp && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Test Code: <strong className="font-mono font-black">{localDebugOtp}</strong></span>
              </div>
              <button
                type="button"
                onClick={fillDebugOtp}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* Error & Feedback alerts */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Verify Button */}
          <button
            type="button"
            disabled={verifying || otp.some(d => !d)}
            onClick={() => submitOtp(otp.join(''))}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {verifying ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Verifying Identity...</span>
              </>
            ) : (
              <>
                <span>Verify & Complete Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend & Support Footer */}
          <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
            <p>
              Didn&apos;t receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="font-semibold text-slate-400">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  {resending ? 'Sending...' : 'Resend Code via Email'}
                </button>
              )}
            </p>
            <p className="text-[11px] text-slate-400">
              Codes expire after 10 minutes. For assistance, contact School Accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
