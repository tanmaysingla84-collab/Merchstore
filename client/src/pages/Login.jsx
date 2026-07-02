import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, clearAuthError, fetchCurrentUser } from '../features/auth/authSlice';
import Loader from '../components/Loader';
import {
  GU_DOMAINS,
  isGUEmail,
  completePendingCartAction,
  consumeAuthRedirectPath,
  getLoginRedirectPath,
  saveAuthRedirectPath,
} from '../utils/authRedirect';

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(isGUEmail, { message: 'Only Geeta University emails are allowed' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();
  const { loading, error, token } = useSelector((s) => s.auth);
  const from = getLoginRedirectPath(location);

  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused]   = useState(false);
  const [passFocused,  setPassFocused]    = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const emailVal = watch('email', '');
  const emailValid = isGUEmail(emailVal) && emailVal.includes('@');

  useEffect(() => {
    if (searchParams.get('error') === 'google_auth_failed') {
      toast.error('Google sign-in failed. Only Geeta University emails are allowed.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
    return () => { dispatch(clearAuthError()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      await dispatch(fetchCurrentUser()).unwrap();
      await completePendingCartAction(dispatch);
      toast.success('Welcome back to GU MerchStore!');
      navigate(consumeAuthRedirectPath(from), { replace: true });
    } catch (err) {
      toast.error(err || 'Failed to authenticate');
    }
  };

  const handleGoogle = () => {
    saveAuthRedirectPath(from);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a14] relative overflow-hidden">
      {loading && <Loader fullScreen />}

      {/* ── Animated Background Orbs ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#7b1c2e]/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#9c2637]/15 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#d4af37]/5 blur-[80px] animate-pulse" style={{ animationDelay: '0.7s' }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Left Hero Panel ──────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-start justify-between p-14 z-10">
        {/* University branding */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9c2637] to-[#7b1c2e] flex items-center justify-center shadow-lg shadow-[#9c2637]/40">
            <span className="font-black text-lg text-[#d4af37]">GU</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Geeta University</p>
            <p className="text-white/40 text-xs mt-0.5">MerchStore Portal</p>
          </div>
        </div>

        {/* Big headline */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[#d4af37] text-xs font-semibold tracking-wide">University Exclusive Access</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Welcome Back to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">
              GU Merch
            </span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Your one-stop campus store for official Geeta University merchandise, stationery and gear.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[['500+', 'Students'], ['50+', 'Products'], ['4.9★', 'Rating']].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-white/40 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <p className="text-white/20 text-xs">© 2026 Geeta University. All rights reserved.</p>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 z-10 relative">
        {/* Glassmorphism card */}
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9c2637] to-[#7b1c2e] flex items-center justify-center">
              <span className="font-black text-sm text-[#d4af37]">GU</span>
            </div>
            <span className="text-white font-bold">GU MerchStore</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Sign In</h2>
            <p className="text-white/40 mt-2 text-sm">Use your official Geeta University email</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                University Email
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                emailFocused
                  ? 'border-[#d4af37]/60 shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                  : errors.email
                  ? 'border-red-500/60'
                  : 'border-white/10'
              } bg-white/5 backdrop-blur-sm`}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors ${emailFocused ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type="email"
                  id="login-email"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="you@geeta.ac.in"
                  autoComplete="email"
                  {...register('email')}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {/* Live domain check indicator */}
                {emailVal && (
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <div className={`w-2 h-2 rounded-full transition-all ${emailValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                passFocused
                  ? 'border-[#d4af37]/60 shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                  : errors.password
                  ? 'border-red-500/60'
                  : 'border-white/10'
              } bg-white/5 backdrop-blur-sm`}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${passFocused ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 relative overflow-hidden group py-3.5 rounded-xl font-bold text-sm text-[#0a0a14] bg-gradient-to-r from-[#d4af37] to-[#f0d060] hover:from-[#e0be4a] hover:to-[#f5dc70] transition-all duration-200 shadow-lg shadow-[#d4af37]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">Sign In to MerchStore</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign In */}
          <button
            id="login-google-btn"
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all duration-200 group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google (GU accounts only)
          </button>

          {/* Domain chips */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {['@geeta.ac.in', '@geetauniversity.ac.in', '@geetauniversity.edu.in'].map((d) => (
              <span key={d} className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-white/40">
                {d}
              </span>
            ))}
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-white/40 mt-8">
            New student?{' '}
            <Link to="/register" state={{ from: location.state?.from }} className="text-[#d4af37] font-semibold hover:text-[#f0d060] transition-colors">
              Create Account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
