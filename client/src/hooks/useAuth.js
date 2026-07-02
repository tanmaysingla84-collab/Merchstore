import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../features/auth/authSlice';
import { clearCartLocal } from '../features/cart/cartSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, loading, error } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutAction());
    dispatch(clearCartLocal());
  };

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn: !!token,
    logout: handleLogout,
  };
};
