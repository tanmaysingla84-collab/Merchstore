import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchCurrentUser } from '../features/auth/authSlice';
import Loader from '../components/Loader';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      dispatch(fetchCurrentUser())
        .unwrap()
        .then(() => {
          toast.success('Successfully logged in with Google!');
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          toast.error(err || 'Failed to fetch user details after Google login');
          navigate('/login', { replace: true });
        });
    } else {
      toast.error('Authentication token not found');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-brand-dark-50">
      <Loader />
      <p className="mt-4 text-sm font-semibold text-brand-dark-600">
        Finalizing Google sign-in...
      </p>
    </div>
  );
};

export default OAuthSuccess;
