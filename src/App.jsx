import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Footer from './layout/Footer.jsx';
import Cursor from './components/Cursor.jsx';
import Navbar from './layout/Navbar.jsx';
import Intro from './layout/Intro.jsx';

// Import all the pages
import LoginPage from './pages/LoginPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import RewardsPage from './pages/RewardsPage.jsx';
import GiftCardsPage from './pages/GiftCardsPage.jsx';
import FindAStorePage from './pages/FindAStorePage.jsx';
// import CartPage from './pages/CartPage.jsx';
// import CheckoutPage from './pages/CheckoutPage.jsx';
// import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
// import ProfilePage from './pages/ProfilePage.jsx';

// Import services and store
import { useAppStore } from './store/appStore';
import { authAPI } from './services/api';
import socketService from './services/socketService';
import toast from 'react-hot-toast';

const App = () => {
  const {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    setRefreshToken,
    setAuthenticated,
    logout
  } = useAppStore();

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for stored tokens
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
          setAuthenticated(true);

          // Connect to socket
          socketService.connect(storedToken);

          // Verify token with server
          try {
            const response = await authAPI.getMe();
            if (response.data.success) {
              setUser(response.data.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
          } catch (error) {
            // Token is invalid, try to refresh
            if (storedRefreshToken) {
              try {
                const refreshResponse = await authAPI.refreshToken(storedRefreshToken);
                if (refreshResponse.data.success) {
                  const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
                  setToken(newToken);
                  setRefreshToken(newRefreshToken);
                  localStorage.setItem('token', newToken);
                  localStorage.setItem('refreshToken', newRefreshToken);

                  // Connect to socket with new token
                  socketService.connect(newToken);
                } else {
                  throw new Error('Refresh failed');
                }
              } catch (refreshError) {
                // Both tokens are invalid, logout
                logout();
                toast.error('Session expired. Please login again.');
              }
            } else {
              logout();
            }
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
        logout();
      }
    };

    initializeApp();
  }, []);

  // Connect/disconnect socket when auth state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
      socketService.subscribeToNotifications();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <div className="app" data-scroll-speed={-5} id='main_container'>
      <Cursor />
      <Intro />
      <Navbar />
      <div className="app_content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/gift-cards" element={<GiftCardsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<LoginPage />} />
          <Route path="/find-a-store" element={<FindAStorePage />} />
          {/* <Route path="/cart" element={<CartPage />} /> */}
          {/* <Route path="/checkout" element={<CheckoutPage />} /> */}
          {/* <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} /> */}
          {/* <Route path="/profile" element={<ProfilePage />} /> */}
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;