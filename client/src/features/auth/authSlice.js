import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;

  const rawId = user._id || user.id;
  const _id = rawId ? String(rawId) : null;

  return {
    ...user,
    ...(_id ? { _id } : {}),
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
  };
};

const normalizeAuthPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { token: null, user: null };
  }

  const source = payload.data && typeof payload.data === 'object' ? payload.data : payload;

  return {
    token: source.token || null,
    user: normalizeUser(source.user),
  };
};

const normalizeUserPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.data && typeof payload.data === 'object') {
    if (payload.data.user) {
      return normalizeUser(payload.data.user);
    }
    return normalizeUser(payload.data);
  }

  return normalizeUser(payload.user);
};

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      const errData = error.response?.data;
      const validationMsg = errData?.errors?.[0]?.message;
      return rejectWithValue(validationMsg || errData?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      const errData = error.response?.data;
      const validationMsg = errData?.errors?.[0]?.message;
      return rejectWithValue(validationMsg || errData?.message || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const addAddress = createAsyncThunk(
  'auth/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/address', addressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add address');
    }
  }
);

const token = localStorage.getItem('token');

const initialState = {
  user: null,
  token: token || null,
  loading: false,
  error: null,
  success: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.error = null;
      state.success = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { token, user } = normalizeAuthPayload(action.payload);
        state.loading = false;
        state.token = token;
        state.user = user;
        state.success = true;
        if (token) {
          localStorage.setItem('token', token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user } = normalizeAuthPayload(action.payload);
        state.loading = false;
        state.token = token;
        state.user = user;
        state.success = true;
        if (token) {
          localStorage.setItem('token', token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Me
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUserPayload(action.payload);
        state.token = localStorage.getItem('token');
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
      })

      // Add Address
      .addCase(addAddress.fulfilled, (state, action) => {
        if (state.user) {
          // Backend returns { success, data: { addresses } }
          state.user.addresses = action.payload.addresses || action.payload.data?.addresses || [];
        }
      });
  },
});

export const { logout, clearAuthError, clearAuthSuccess } = authSlice.actions;
export default authSlice.reducer;
