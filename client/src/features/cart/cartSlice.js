import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async (itemData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/cart/add', itemData);
      dispatch(fetchCart()); // Refresh full populated cart
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async (itemData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put('/cart/update', itemData);
      dispatch(fetchCart());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item quantity');
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/remove',
  async (productId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      dispatch(fetchCart());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartLocal: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { success, data: { items, itemCount, subtotal } }
        state.items = action.payload?.data?.items ?? action.payload?.cart ?? [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
      });
  }
});

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
