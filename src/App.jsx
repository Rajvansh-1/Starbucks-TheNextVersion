import React, { useState } from 'react';
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

const App = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
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
          <Route path="/menu" element={<MenuPage addToCart={addToCart} />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/gift-cards" element={<GiftCardsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<LoginPage />} />
          <Route path="/find-a-store" element={<FindAStorePage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;

