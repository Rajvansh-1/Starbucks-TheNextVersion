import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post('/auth/register', userData),

  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    order?: string;
    minPrice?: number;
    maxPrice?: number;
    dietary?: string[];
    isFeatured?: boolean;
    isNew?: boolean;
    isSeasonal?: boolean;
  }) => api.get('/products', { params }),

  getById: (id: string) => api.get(`/products/${id}`),

  getFeatured: () => api.get('/products/featured'),

  getNew: () => api.get('/products/new'),

  getSeasonal: () => api.get('/products/seasonal'),

  getCategories: () => api.get('/products/categories'),

  create: (productData: any) => api.post('/products', productData),

  update: (id: string, productData: any) =>
    api.put(`/products/${id}`, productData),

  delete: (id: string) => api.delete(`/products/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (orderData: {
    items: Array<{
      product: string;
      quantity: number;
      size: string;
      customizations?: any;
    }>;
    store?: string;
    orderType: 'pickup' | 'delivery' | 'dine-in';
    paymentMethod: 'card' | 'cash' | 'rewards' | 'gift-card';
    deliveryAddress?: any;
    tip?: number;
    notes?: string;
    rewardsUsed?: number;
  }) => api.post('/orders', orderData),

  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/orders', { params }),

  getById: (id: string) => api.get(`/orders/${id}`),

  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),

  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),

  createPaymentIntent: (id: string) =>
    api.post(`/orders/${id}/payment-intent`),

  confirmPayment: (id: string, paymentIntentId: string) =>
    api.post(`/orders/${id}/confirm-payment`, { paymentIntentId }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    profileImage?: string;
  }) => api.put('/users/profile', profileData),

  updatePreferences: (preferences: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    dietaryRestrictions?: string[];
    favoriteStores?: string[];
  }) => api.put('/users/preferences', preferences),

  addAddress: (addressData: {
    type: 'home' | 'work' | 'other';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    isDefault?: boolean;
  }) => api.post('/users/addresses', addressData),

  updateAddress: (addressId: string, addressData: any) =>
    api.put(`/users/addresses/${addressId}`, addressData),

  deleteAddress: (addressId: string) =>
    api.delete(`/users/addresses/${addressId}`),

  getRewards: () => api.get('/users/rewards'),

  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => api.put('/users/change-password', passwordData),
};

// Payments API
export const paymentsAPI = {
  createIntent: (data: {
    amount: number;
    currency?: string;
    metadata?: any;
  }) => api.post('/payments/create-intent', data),

  confirm: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),

  createCustomer: (customerData: {
    email: string;
    name: string;
    phone?: string;
    address?: any;
  }) => api.post('/payments/create-customer', customerData),

  getPaymentMethods: () => api.get('/payments/payment-methods'),

  addPaymentMethod: (paymentMethodId: string) =>
    api.post('/payments/payment-methods', { paymentMethodId }),

  removePaymentMethod: (paymentMethodId: string) =>
    api.delete(`/payments/payment-methods/${paymentMethodId}`),
};

// Stores API
export const storesAPI = {
  getAll: (params?: {
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => api.get('/stores', { params }),

  getById: (id: string) => api.get(`/stores/${id}`),

  getHours: (id: string) => api.get(`/stores/${id}/hours`),

  getNearby: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }) => api.get('/stores/nearby', { params }),
};

// Rewards API
export const rewardsAPI = {
  getAll: () => api.get('/rewards'),

  getAvailable: () => api.get('/rewards/available'),

  getStatus: () => api.get('/rewards/status'),

  redeem: (data: {
    rewardId: string;
    storeId?: string;
  }) => api.post('/rewards/redeem', data),

  getHistory: () => api.get('/rewards/history'),

  getTiers: () => api.get('/rewards/tiers'),
};

// Gift Cards API
export const giftCardsAPI = {
  getDesigns: () => api.get('/gift-cards/designs'),

  create: (data: {
    designId: string;
    amount: number;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
    deliveryMethod: 'email' | 'sms' | 'print';
  }) => api.post('/gift-cards/create', data),

  getMyCards: () => api.get('/gift-cards/my-cards'),

  checkBalance: (data: {
    giftCardNumber: string;
    pin: string;
  }) => api.post('/gift-cards/check-balance', data),

  use: (data: {
    giftCardNumber: string;
    pin: string;
    amount: number;
  }) => api.post('/gift-cards/use', data),

  generatePDF: (giftCardId: string) =>
    api.post('/gift-cards/generate-pdf', { giftCardId }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) => api.get('/admin/users', { params }),

  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),

  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    orderType?: string;
  }) => api.get('/admin/orders', { params }),

  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  getProductAnalytics: () => api.get('/admin/products/analytics'),

  clearCache: (pattern?: string) =>
    api.post('/admin/cache/clear', { pattern }),

  getLogs: (params?: {
    page?: number;
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/logs', { params }),
};

export default api;
