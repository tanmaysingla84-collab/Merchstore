import toast from 'react-hot-toast';
import { addToCart } from '../features/cart/cartSlice';

export const GU_DOMAINS = ['@geeta.ac.in', '@geetauniversity.ac.in', '@geetauniversity.edu.in', '@geeta.edu'];

export const isGUEmail = (email = '') =>
  GU_DOMAINS.some((domain) => email.toLowerCase().trim().endsWith(domain));

const PENDING_CART_KEY = 'pendingCartAction';
const AUTH_REDIRECT_KEY = 'authRedirectPath';

export const savePendingCartAction = (action) => {
  sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(action));
};

export const consumePendingCartAction = () => {
  const raw = sessionStorage.getItem(PENDING_CART_KEY);
  sessionStorage.removeItem(PENDING_CART_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAuthRedirectPath = (path) => {
  if (path) {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
  }
};

export const consumeAuthRedirectPath = (fallback = '/products') => {
  const path = sessionStorage.getItem(AUTH_REDIRECT_KEY) || fallback;
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  return path;
};

export const getLoginRedirectPath = (location, fallback = '/products') =>
  location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : fallback;

export const redirectToLogin = (navigate, location, pendingAction = null) => {
  if (pendingAction) {
    savePendingCartAction(pendingAction);
  }

  saveAuthRedirectPath(`${location.pathname}${location.search || ''}`);
  navigate('/login', { state: { from: location } });
};

export const completePendingCartAction = async (dispatch) => {
  const pending = consumePendingCartAction();
  if (!pending) return false;

  try {
    await dispatch(addToCart(pending)).unwrap();
    toast.success(
      pending.productName
        ? `Added ${pending.productName}${pending.size ? ` (${pending.size})` : ''} to cart!`
        : 'Item added to cart!'
    );
    return true;
  } catch (err) {
    toast.error(err || 'Failed to add item to cart after login');
    return false;
  }
};
