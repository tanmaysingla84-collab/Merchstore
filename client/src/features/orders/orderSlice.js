import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { clearCartLocal } from '../cart/cartSlice';

// Async Thunks
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/orders/create', orderData);
      dispatch(clearCartLocal()); // Clear local Redux cart
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

export const validateCoupon = createAsyncThunk(
  'orders/validateCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/coupons/validate', { code });
      return { code, discountPct: response.data.discountPct };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon code');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load order history');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/single/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Order not found');
    }
  }
);

const initialState = {
  list: [],
  currentOrder: null,
  activeCoupon: null,
  couponError: null,
  loading: false,
  error: null,
  success: false,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderState: (state) => {
      state.success = false;
      state.error = null;
      state.currentOrder = null;
    },
    clearCoupon: (state) => {
      state.activeCoupon = null;
      state.couponError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
        state.success = true;
        state.activeCoupon = null; // Reset coupon after purchase
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate Coupon
      .addCase(validateCoupon.pending, (state) => {
        state.couponError = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.activeCoupon = action.payload;
        state.couponError = null;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.activeCoupon = null;
        state.couponError = action.payload;
      })

      // Fetch All User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.orders;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Order By Id
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearOrderState, clearCoupon } = orderSlice.actions;
export default orderSlice.reducer;
