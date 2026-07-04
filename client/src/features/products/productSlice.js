import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../admin/adminSlice';

const normalizeProductsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.products)) return payload.products;

  return [];
};

const normalizeProductPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null;

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.product && typeof payload.product === 'object' && !Array.isArray(payload.product)) {
    return payload.product;
  }

  return null;
};

// Async Thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Product not found');
    }
  }
);

const initialState = {
  items: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    category: 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  }
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = normalizeProductsPayload(action.payload);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By Id
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = normalizeProductPayload(action.payload);
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync public catalog when admin manages products
      .addCase(createAdminProduct.fulfilled, (state, action) => {
        const newProduct = action.payload?.data;
        if (newProduct?._id) {
          state.items = [newProduct, ...state.items.filter((p) => p._id !== newProduct._id)];
        }
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (!updated?._id) return;

        if (updated.isActive === false) {
          state.items = state.items.filter((p) => p._id !== updated._id);
        } else {
          const index = state.items.findIndex((p) => p._id === updated._id);
          if (index !== -1) {
            state.items[index] = updated;
          } else {
            state.items = [updated, ...state.items];
          }
        }

        if (state.selectedProduct?._id === updated._id) {
          state.selectedProduct = updated;
        }
      })
      .addCase(deleteAdminProduct.fulfilled, (state, action) => {
        const { id } = action.payload;
        state.items = state.items.filter((p) => p._id !== id);
        if (state.selectedProduct?._id === id) {
          state.selectedProduct = null;
        }
      });
  }
});

export const { setFilter, resetFilters, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
