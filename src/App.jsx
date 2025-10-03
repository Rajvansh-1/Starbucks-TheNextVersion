import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Footer from './layout/Footer';
import Cursor from './components/Cursor';
import Navbar from './layout/Navbar';
import Intro from './layout/Intro';

// Import the new pages
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import RewardsPage from './pages/RewardsPage';
import GiftCardsPage from './pages/GiftCardsPage';

const App = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`${product.name} has been added to your bag!`);
    console.log('Cart:', [...cart, product]);
  };

  return (
    <div className="app" data-scroll-speed={-5} id='main_container'>
      <Cursor />
      <Intro />
      <Navbar />
      <div className="app_content">
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/gift-cards" element={<GiftCardsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<LoginPage />} /> {/* Re-using login page for "Join Now" */}
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;