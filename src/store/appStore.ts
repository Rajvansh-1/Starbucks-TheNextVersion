import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  rewards: {
    stars: number;
    level: string;
    totalSpent: number;
    joinDate: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    dietaryRestrictions: string[];
    favoriteStores: string[];
  };
  addresses: Array<{
    _id?: string;
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
  createdAt: string;
}

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  size: string;
  customizations: {
    milk?: string;
    syrup?: string[];
    toppings?: string[];
    temperature?: string;
    specialInstructions?: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  items: CartItem[];
  orderType: 'pickup' | 'delivery' | 'dine-in';
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  estimatedReadyTime?: string;
}

interface AppState {
  // Auth state
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Cart state
  cart: CartItem[];
  cartTotal: number;

  // Orders state
  orders: Order[];
  currentOrder: Order | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;

  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, customizations: any) => void;
  updateCartItemQuantity: (productId: string, size: string, customizations: any, quantity: number) => void;
  clearCart: () => void;
  calculateCartTotal: () => void;

  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setCurrentOrder: (order: Order | null) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      cart: [],
      cartTotal: 0,

      orders: [],
      currentOrder: null,

      isLoading: false,
      error: null,

      // Auth actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // Cart actions
      addToCart: (item) => {
        const { cart } = get();
        const existingItemIndex = cart.findIndex(
          (cartItem) =>
            cartItem.product._id === item.product._id &&
            cartItem.size === item.size &&
            JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
        );

        if (existingItemIndex >= 0) {
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += item.quantity;
          set({ cart: updatedCart });
        } else {
          set({ cart: [...cart, item] });
        }

        get().calculateCartTotal();
      },

      removeFromCart: (productId, size, customizations) => {
        const { cart } = get();
        const updatedCart = cart.filter(
          (item) =>
            !(item.product._id === productId &&
              item.size === size &&
              JSON.stringify(item.customizations) === JSON.stringify(customizations))
        );
        set({ cart: updatedCart });
        get().calculateCartTotal();
      },

      updateCartItemQuantity: (productId, size, customizations, quantity) => {
        const { cart } = get();
        const updatedCart = cart.map((item) => {
          if (
            item.product._id === productId &&
            item.size === size &&
            JSON.stringify(item.customizations) === JSON.stringify(customizations)
          ) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ cart: updatedCart });
        get().calculateCartTotal();
      },

      clearCart: () => set({ cart: [], cartTotal: 0 }),

      calculateCartTotal: () => {
        const { cart } = get();
        const total = cart.reduce((sum, item) => {
          return sum + (item.product.price * item.quantity);
        }, 0);
        set({ cartTotal: total });
      },

      // Orders actions
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => {
        const { orders } = get();
        set({ orders: [order, ...orders] });
      },
      updateOrder: (orderId, updates) => {
        const { orders } = get();
        const updatedOrders = orders.map((order) =>
          order._id === orderId ? { ...order, ...updates } : order
        );
        set({ orders: updatedOrders });
      },
      setCurrentOrder: (order) => set({ currentOrder: order }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          cart: [],
          cartTotal: 0,
          orders: [],
          currentOrder: null,
          error: null,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },
    }),
    {
      name: 'starbucks-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
        cartTotal: state.cartTotal,
        orders: state.orders,
      }),
    }
  )
);
