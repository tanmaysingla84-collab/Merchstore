import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks for Admin Products CRUD
export const createAdminProduct = createAsyncThunk(
  'admin/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products/admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateAdminProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/admin/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteAdminProduct = createAsyncThunk(
  'admin/deleteProduct',
  async ({ id, hardDelete = false }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/products/admin/${id}`, {
        params: { hardDelete },
      });
      return { id, data: response.data, hardDelete };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

// Async Thunks for Admin Orders
export const fetchAdminOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/admin/all', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load orders');
    }
  }
);

export const updateAdminOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/admin/${id}/status`, { status, note });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

export const updateAdminOrderPaymentStatus = createAsyncThunk(
  'admin/updateOrderPaymentStatus',
  async ({ id, paymentStatus }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/admin/${id}/payment-status`, { paymentStatus });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment status');
    }
  }
);

// Async Thunks for Admin Analytics
export const fetchAnalyticsSummary = createAsyncThunk(
  'admin/fetchAnalyticsSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics/summary');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load analytics summary');
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  'admin/fetchRevenueAnalytics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics/revenue', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load revenue analytics');
    }
  }
);

export const fetchTopProductsAnalytics = createAsyncThunk(
  'admin/fetchTopProductsAnalytics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics/top-products', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load top products analytics');
    }
  }
);

const initialState = {
  orders: [],
  ordersPagination: null,
  analytics: {
    summary: null,
    revenue: [],
    topProducts: [],
  },
  loading: {
    products: false,
    orders: false,
    analytics: false,
  },
  error: {
    products: null,
    orders: null,
    analytics: null,
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    updateOrderStatusSocket: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => String(o._id) === String(orderId));
      if (order) {
        order.status = status;
      }
    },
    clearAdminError: (state) => {
      state.error = initialState.error;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Product
      .addCase(createAdminProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(createAdminProduct.fulfilled, (state) => {
        state.loading.products = false;
      })
      .addCase(createAdminProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })

      // Update Product
      .addCase(updateAdminProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(updateAdminProduct.fulfilled, (state) => {
        state.loading.products = false;
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })

      // Delete Product
      .addCase(deleteAdminProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(deleteAdminProduct.fulfilled, (state) => {
        state.loading.products = false;
      })
      .addCase(deleteAdminProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })

      // Fetch Orders
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = action.payload.data || [];
        state.ordersPagination = action.payload.pagination || null;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })

      // Update Order Status
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.loading.orders = false;
        const updatedOrder = action.payload.data;
        if (updatedOrder) {
          const index = state.orders.findIndex(
            (o) => String(o._id) === String(updatedOrder.orderId)
          );
          if (index !== -1) {
            state.orders[index].status = updatedOrder.status;
            if (updatedOrder.history) {
              state.orders[index].statusHistory = updatedOrder.history;
            }
          }
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })

      // Update Order Payment Status
      .addCase(updateAdminOrderPaymentStatus.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(updateAdminOrderPaymentStatus.fulfilled, (state, action) => {
        state.loading.orders = false;
        const updatedOrder = action.payload.data;
        if (updatedOrder) {
          const index = state.orders.findIndex(
            (o) => String(o._id) === String(updatedOrder.orderId)
          );
          if (index !== -1) {
            state.orders[index].paymentStatus = updatedOrder.paymentStatus;
            if (updatedOrder.history) {
              state.orders[index].statusHistory = updatedOrder.history;
            }
          }
        }
      })
      .addCase(updateAdminOrderPaymentStatus.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })

      // Fetch Analytics Summary
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.loading.analytics = true;
        state.error.analytics = null;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics.summary = action.payload.data || null;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error.analytics = action.payload;
      })

      // Fetch Revenue Analytics
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.loading.analytics = true;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics.revenue = action.payload.data || { periods: [] };
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error.analytics = action.payload;
      })

      // Fetch Top Products Analytics
      .addCase(fetchTopProductsAnalytics.pending, (state) => {
        state.loading.analytics = true;
      })
      .addCase(fetchTopProductsAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics.topProducts = action.payload.data || [];
      })
      .addCase(fetchTopProductsAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error.analytics = action.payload;
      });
  },
});

export const { updateOrderStatusSocket, clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
