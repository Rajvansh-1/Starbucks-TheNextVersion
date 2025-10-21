// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Footer from './layout/Footer.jsx';
import Cursor from './components/Cursor.jsx';
import Navbar from './layout/Navbar.jsx';
import Intro from './layout/Intro.jsx';
import { account } from './appwriteConfig';
import { ID } from 'appwrite'; // Import ID

// Import pages
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx'; // Import SignupPage
import MenuPage from './pages/MenuPage.jsx';
import RewardsPage from './pages/RewardsPage.jsx';
import GiftCardsPage from './pages/GiftCardsPage.jsx';
import FindAStorePage from './pages/FindAStorePage.jsx';

const App = () => {
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoadingAuth(true);
    setAuthError(null); // Clear previous errors on check
    try {
      const userAccount = await account.get();
      setCurrentUser(userAccount);
    } catch (error) {
      setCurrentUser(null);
    } finally {
       setLoadingAuth(false);
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
    alert(`${product.name} has been added to your bag!`);
    console.log('Cart:', [...cart, product]);
  };

  const handleLogin = async (email, password) => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      await account.createEmailPasswordSession(email, password);
      const userAccount = await account.get();
      setCurrentUser(userAccount);
      navigate('/');
      return true;
    } catch (error) {
      console.error("Appwrite login error:", error);
      setAuthError(error.message || 'Failed to log in. Please check your credentials.');
      setCurrentUser(null); // Ensure user is null on error
      return false;
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      await account.deleteSession('current');
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      console.error("Appwrite logout error:", error);
      setAuthError('Failed to log out.');
    } finally {
        setLoadingAuth(false);
    }
  };

 // --- Appwrite Signup Handler ---
  const handleSignup = async (email, password, name) => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      // Create the user account
      await account.create(ID.unique(), email, password, name);
      // Log the user in immediately after signup
      await account.createEmailPasswordSession(email, password);
      // Fetch the newly created user data
      const userAccount = await account.get();
      setCurrentUser(userAccount);
      navigate('/'); // Redirect to home after successful signup and login
      return true;
    } catch (error) {
      console.error("Appwrite signup error:", error);
      // Provide more specific error messages if possible
      let errorMessage = 'Failed to sign up.';
      if (error.message.includes('A user with the same email already exists')) {
        errorMessage = 'An account with this email already exists. Please log in.';
      } else if (error.message.includes('Password must be at least 8 characters long')) {
          errorMessage = 'Password must be at least 8 characters long.';
      }
      setAuthError(errorMessage);
      setCurrentUser(null); // Ensure user is null on error
      return false;
    } finally {
      setLoadingAuth(false);
    }
  };


  if (loadingAuth && !currentUser) {
      // Still show loading only on the initial auth check
      // return <div>Loading...</div>; // You might want a better loading indicator
  }

  return (
    <div className="app" data-scroll-speed={-5} id='main_container'>
      <Cursor />
      <Intro />
      <Navbar currentUser={currentUser} handleLogout={handleLogout} />
      <div className="app_content">
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/menu" element={<MenuPage addToCart={addToCart} />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/gift-cards" element={<GiftCardsPage />} />
          <Route
            path="/login"
            element={<LoginPage handleLogin={handleLogin} loading={loadingAuth} error={authError} />}
          />
           {/* Update /join to point to SignupPage */}
           <Route
            path="/join"
            element={<SignupPage handleSignup={handleSignup} loading={loadingAuth} error={authError} />}
          />
          {/* Add the new /signup route */}
          <Route
            path="/signup"
            element={<SignupPage handleSignup={handleSignup} loading={loadingAuth} error={authError} />}
           />
          <Route path="/find-a-store" element={<FindAStorePage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;