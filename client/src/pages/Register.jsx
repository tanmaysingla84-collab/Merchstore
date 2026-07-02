import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, clearAuthError } from '../features/auth/authSlice';
import Loader from '../components/Loader';

// Zod Schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(
      (val) => val.endsWith('@geeta.ac.in') || val.endsWith('@geetauniversity.ac.in'),
      { message: 'Only Geeta University emails (@geeta.ac.in or @geetauniversity.ac.in) are allowed' }
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [token, navigate, dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data) => {
    const { name, email, password } = data;
    dispatch(registerUser({ name, email, password }))
      .unwrap()
      .then(() => {
        toast.success('Registration successful! Welcome to the GU family.');
        navigate('/dashboard');
      })
      .catch((err) => {
        toast.error(err || 'Registration failed');
      });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-gradient-to-tr from-brand-maroon-50/20 via-brand-dark-50 to-brand-gold-50/10">
      {loading && <Loader fullScreen />}

      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-maroon-700 text-white shadow-premium mb-4">
            <span className="font-display font-bold text-xl text-brand-gold-300">GU</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-brand-dark-900 tracking-tight">
            Create Account
          </h2>
          <p className="font-sans text-sm text-brand-dark-500 mt-2">
            Join the Geeta University Merchandise Hub
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-brand-dark-100 rounded-2xl shadow-premium p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-dark-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  className={`input-field pl-10 ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Rahul Singh"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* University Email */}
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
              <p className="text-[10px] text-brand-dark-400 mt-1">
                Must end with @geeta.ac.in or @geetauniversity.ac.in
              </p>
            </div>

            {/* Password */}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-dark-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="w-full btn-primary py-3.5 mt-2">
              Create Account
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-brand-dark-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-maroon-700 hover:text-brand-maroon-600 transition-colors">
            Sign In Instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
