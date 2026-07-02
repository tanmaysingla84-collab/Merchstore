import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Layout & Security
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

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

// State Actions
import { fetchCurrentUser } from './features/auth/authSlice';

function App() {
  const dispatch = useDispatch();

  // Hydrate auth user on boot if token is found
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-brand-dark-50 text-brand-dark-800 font-sans">
        {/* Global Toast Alerts */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
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
          }}
        />

        {/* Global Navbar */}
        <Navbar />

        {/* Dynamic Viewport */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            
            {/* Protected Routes */}
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
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
