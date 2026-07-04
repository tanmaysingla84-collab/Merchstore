import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/Loader';

const AdminRoutes = ({ children }) => {
  const { user, token, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return loading ? <Loader fullScreen /> : <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoutes;
