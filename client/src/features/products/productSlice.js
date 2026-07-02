import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

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
        state.items = action.payload.products;
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
        state.selectedProduct = action.payload.product;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilter, resetFilters, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
