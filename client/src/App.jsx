import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Layout & Security
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoutes from './routes/AdminRoutes';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirm from './pages/OrderConfirm';
import UserDashboard from './pages/UserDashboard';
import OAuthSuccess from './pages/OAuthSuccess';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrderReceipt from './pages/OrderReceipt';

// State Actions
import { fetchCurrentUser } from './features/auth/authSlice';

const toastOptions = {
  position: 'bottom-right',
  toastOptions: {
    duration: 3500,
    style: {
      background: '#0F172A',
      color: '#F8FAFC',
      borderRadius: '12px',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
      padding: '12px 18px',
      boxShadow: '0 10px 30px -10px rgba(105, 18, 44, 0.15)',
    },
    success: {
      iconTheme: {
        primary: '#D4AF37',
        secondary: '#0F172A',
      },
    },
  },
};

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/register', '/oauth-success'].includes(location.pathname);
  const showPublicChrome = !isAdminRoute;

  return (
    <div className={`flex flex-col ${isAdminRoute ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-brand-dark-50 text-brand-dark-800 font-sans`}>
      <Toaster {...toastOptions} />

      {showPublicChrome && <Navbar />}

      <main className={isAdminRoute ? 'flex-1 min-h-0 overflow-hidden' : 'flex-grow'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirm/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:orderId/receipt"
            element={
              <ProtectedRoute>
                <OrderReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <AdminRoutes>
                <AdminDashboard />
              </AdminRoutes>
            }
          />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {showPublicChrome && !isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
