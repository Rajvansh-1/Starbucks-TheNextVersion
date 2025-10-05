import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Footer from './layout/Footer.jsx';
import Cursor from './components/Cursor.jsx';
import Navbar from './layout/Navbar.jsx';
import Intro from './layout/Intro.jsx';
import users from './json/users.json'; // Import our fake user database

// Import all the pages
import LoginPage from './pages/LoginPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import RewardsPage from './pages/RewardsPage.jsx';
import GiftCardsPage from './pages/GiftCardsPage.jsx';
import FindAStorePage from './pages/FindAStorePage.jsx';

const App = () => {
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
    alert(`${product.name} has been added to your bag!`);
    console.log('Cart:', [...cart, product]);
  };

  const handleLogin = (email, password) => {
    const user = users.find(
      (user) => user.email === email && user.password === password
    );

    if (user) {
      setCurrentUser(user);
      navigate('/'); // Redirect to home on successful login
      return true;
    } else {
      alert('Invalid email or password.');
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/'); // Redirect to home on logout
  };


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
          <Route path="/login" element={<LoginPage handleLogin={handleLogin} />} />
          <Route path="/join" element={<LoginPage handleLogin={handleLogin} />} />
          <Route path="/find-a-store" element={<FindAStorePage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;