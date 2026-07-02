import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, clearAuthError } from '../features/auth/authSlice';
import Loader from '../components/Loader';

// Zod Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, token } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // If already logged in, redirect away
    if (token) {
      navigate(from, { replace: true });
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [token, navigate, from, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data))
      .unwrap()
      .then(() => {
        toast.success('Welcome back to GU MerchStore!');
      })
      .catch((err) => {
        toast.error(err || 'Failed to authenticate');
      });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-tr from-brand-maroon-50/20 via-brand-dark-50 to-brand-gold-50/10">
      {loading && <Loader fullScreen />}
      
      <div className="w-full max-w-md">
        {/* Card Header branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-maroon-700 text-white shadow-premium mb-4">
            <span className="font-display font-bold text-xl text-brand-gold-300">GU</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-brand-dark-900 tracking-tight">
            Sign In
          </h2>
          <p className="font-sans text-sm text-brand-dark-500 mt-2">
            Access your university account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-brand-dark-100 rounded-2xl shadow-premium p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-2">
                University Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-dark-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="student@geeta.ac.in"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-dark-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  className={`input-field pl-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button type="submit" className="w-full btn-primary py-3.5 mt-2">
              Sign In
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-dark-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-brand-dark-500 font-semibold tracking-wider">OR</span>
            </div>
          </div>

          {/* Social Signin Mock */}
          <button
            type="button"
            onClick={() => {
              // Simulate Google OAuth response
              toast.promise(
                new Promise((resolve) => setTimeout(resolve, 1000)),
                {
                  loading: 'Connecting to Google...',
                  success: () => {
                    dispatch(loginUser({ email: 'student@geeta.ac.in', password: 'password123' }));
                    return 'Logged in with Google successfully!';
                  },
                  error: 'Google login failed',
                }
              );
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-brand-dark-200 hover:border-brand-maroon-300 rounded-xl bg-white hover:bg-brand-maroon-50/10 text-sm font-semibold text-brand-dark-700 hover:text-brand-maroon-700 transition-all duration-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-brand-dark-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-maroon-700 hover:text-brand-maroon-600 transition-colors">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
