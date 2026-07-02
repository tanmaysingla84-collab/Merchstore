import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!token) {
    // Redirect to login while keeping track of current page for redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
