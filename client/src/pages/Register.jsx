import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, clearAuthError } from '../features/auth/authSlice';
import Loader from '../components/Loader';

const GU_DOMAINS = ['@geeta.ac.in', '@geetauniversity.ac.in', '@geetauniversity.edu.in'];
const isGUEmail  = (val) => GU_DOMAINS.some(d => val.toLowerCase().endsWith(d));

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(isGUEmail, { message: 'Only Geeta University emails (@geeta.ac.in / @geetauniversity.ac.in / @geetauniversity.edu.in) are allowed' }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const StrengthBar = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels   = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors   = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < strength ? colors[strength] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: colors[strength] || 'rgba(255,255,255,0.3)' }}>
        {labels[strength]} password
      </p>
    </div>
  );
};

const PasswordRule = ({ met, label }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-white/30'}`}>
    {met ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
    <span>{label}</span>
  </div>
);

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s) => s.auth);

  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [focusedField,    setFocusedField]    = useState(null);
  const [showRules,       setShowRules]       = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const emailVal    = watch('email', '');
  const passwordVal = watch('password', '');
  const emailValid  = isGUEmail(emailVal) && emailVal.includes('@');

  useEffect(() => {
    if (token) navigate('/dashboard');
    return () => { dispatch(clearAuthError()); };
  }, [token, navigate, dispatch]);

  const onSubmit = (data) => {
    const { name, email, password } = data;
    dispatch(registerUser({ name, email, password }))
      .unwrap()
      .then(() => {
        toast.success('Welcome to the GU family! 🎓');
        navigate('/dashboard');
      })
      .catch((err) => toast.error(err || 'Registration failed'));
  };

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  const fieldClass = (field) => `relative rounded-xl border transition-all duration-200 ${
    focusedField === field
      ? 'border-[#d4af37]/60 shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
      : errors[field]
      ? 'border-red-500/60'
      : 'border-white/10'
  } bg-white/5 backdrop-blur-sm`;

  return (
    <div className="min-h-screen flex bg-[#0a0a14] relative overflow-hidden">
      {loading && <Loader fullScreen />}

      {/* ── Animated Background ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full bg-[#7b1c2e]/20 blur-[130px] animate-pulse" />
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full bg-[#9c2637]/15 blur-[110px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-[250px] h-[250px] rounded-full bg-[#d4af37]/6 blur-[70px] animate-pulse" style={{ animationDelay: '0.5s' }} />
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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9c2637] to-[#7b1c2e] flex items-center justify-center shadow-lg shadow-[#9c2637]/40">
            <span className="font-black text-lg text-[#d4af37]">GU</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Geeta University</p>
            <p className="text-white/40 text-xs mt-0.5">MerchStore Portal</p>
          </div>
        </div>

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[#d4af37] text-xs font-semibold tracking-wide">Students & Faculty Only</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Join the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">
              GU Community
            </span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Create your official Geeta University MerchStore account and start shopping exclusive campus gear.
          </p>

          {/* Perks */}
          <ul className="mt-10 space-y-3.5">
            {[
              'Exclusive GU merchandise & stationery',
              'Fast campus delivery to your hostel',
              'Student discount coupons every semester',
              'Order tracking & easy returns',
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-white/60 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/20 text-xs">© 2026 Geeta University. All rights reserved.</p>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 z-10 relative overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9c2637] to-[#7b1c2e] flex items-center justify-center">
              <span className="font-black text-sm text-[#d4af37]">GU</span>
            </div>
            <span className="text-white font-bold">GU MerchStore</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
            <p className="text-white/40 mt-2 text-sm">Use your official Geeta University email to register</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Full Name</label>
              <div className={fieldClass('name')}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <User className={`w-4 h-4 transition-colors ${focusedField === 'name' ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type="text"
                  id="reg-name"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="Rahul Kumar"
                  autoComplete="name"
                  {...register('name')}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1.5 ml-1">⚠ {errors.name.message}</p>}
            </div>

            {/* University Email */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">University Email</label>
              <div className={fieldClass('email')}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type="email"
                  id="reg-email"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="you@geetauniversity.edu.in"
                  autoComplete="email"
                  {...register('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {emailVal && (
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <div className={`w-2 h-2 rounded-full transition-all ${emailValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                )}
              </div>
              {errors.email
                ? <p className="text-xs text-red-400 mt-1.5 ml-1">⚠ {errors.email.message}</p>
                : <p className="text-[10px] text-white/25 mt-1.5 ml-1">@geeta.ac.in · @geetauniversity.ac.in · @geetauniversity.edu.in</p>
              }
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Password</label>
              <div className={fieldClass('password')}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  id="reg-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('password')}
                  onFocus={() => { setFocusedField('password'); setShowRules(true); }}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <StrengthBar password={passwordVal} />
              {showRules && passwordVal && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <PasswordRule met={passwordVal.length >= 8}         label="8+ characters" />
                  <PasswordRule met={/[A-Z]/.test(passwordVal)}       label="Uppercase letter" />
                  <PasswordRule met={/[0-9]/.test(passwordVal)}       label="Number" />
                  <PasswordRule met={/[^A-Za-z0-9]/.test(passwordVal)} label="Special character" />
                </div>
              )}
              {errors.password && <p className="text-xs text-red-400 mt-1.5 ml-1">⚠ {errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className={fieldClass('confirmPassword')}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${focusedField === 'confirmPassword' ? 'text-[#d4af37]' : 'text-white/30'}`} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="reg-confirm-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-white/20 text-sm font-medium rounded-xl outline-none"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/70 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5 ml-1">⚠ {errors.confirmPassword.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 relative overflow-hidden group py-3.5 rounded-xl font-bold text-sm text-[#0a0a14] bg-gradient-to-r from-[#d4af37] to-[#f0d060] hover:from-[#e0be4a] hover:to-[#f5dc70] transition-all duration-200 shadow-lg shadow-[#d4af37]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">Create My GU Account</span>
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

          {/* Google Sign Up */}
          <button
            id="reg-google-btn"
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign up with Google (GU accounts only)
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-white/40 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#d4af37] font-semibold hover:text-[#f0d060] transition-colors">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
