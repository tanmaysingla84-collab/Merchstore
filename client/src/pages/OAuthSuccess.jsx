import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchCurrentUser } from '../features/auth/authSlice';
import { completePendingCartAction, consumeAuthRedirectPath } from '../utils/authRedirect';
import Loader from '../components/Loader';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const finalizeLogin = async () => {
      const token = searchParams.get('token');
      if (!token) {
        toast.error('Authentication token not found');
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('token', token);

      try {
        const result = await dispatch(fetchCurrentUser()).unwrap();
        const role = result?.data?.role;
        await completePendingCartAction(dispatch);
        toast.success('Successfully logged in with Google!');

        if (role === 'admin') {
          navigate('/admin/analytics', { replace: true });
        } else {
          navigate(consumeAuthRedirectPath('/products'), { replace: true });
        }
      } catch (err) {
        toast.error(err || 'Failed to fetch user details after Google login');
        navigate('/login', { replace: true });
      }
    };

    finalizeLogin();
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
