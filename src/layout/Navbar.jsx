import React, { useState } from 'react';
import styles from '../styles/Navbar.module.css';
import { FaLocationDot } from "react-icons/fa6";
import { AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMenuBook } from 'react-icons/md';
import { IoGift, IoStorefrontSharp } from 'react-icons/io5';
import { BsFillCreditCard2FrontFill } from 'react-icons/bs';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header className={styles.header}>
            <nav className={styles.navbar_main_container}>
                <img src="https://res.cloudinary.com/dvmuf6jfj/image/upload/v1720633150/Starbucks/22_xavkyq.png" alt="logo" className={styles.logo} onClick={() => navigate('/')} style={{cursor: 'pointer'}} />

                <div className={`${styles.navbar_content_container} ${isMenuOpen ? styles.open : ''}`}>
                    <div className={styles.branding_items}>
                        <Link to="/menu">Menu</Link>
                        <Link to="/rewards">Rewards</Link>
                        <Link to="/gift-cards">Gift Cards</Link>
                    </div>

                    <div className={styles.user_items}>
                        {/* This link now correctly points to the store finder page */}
                        <Link to="/find-a-store"><FaLocationDot /> Find a Store</Link>
                        
                        {/* This button now correctly navigates to the login page */}
                        <button className={styles.signIn} onClick={() => navigate('/login')}>Sign In</button>
                        
                        <button onClick={() => navigate('/join')}>Join Now</button>
                    </div>
                </div>

                <div className={styles.mob_options}>
                    <AiOutlineSearch />
                    {isMenuOpen ? <AiOutlineClose onClick={() => setIsMenuOpen(false)} /> : <RxHamburgerMenu onClick={() => setIsMenuOpen(true)} />}
                </div>
            </nav>

            <ul className={` ${styles.mob_links} ${isMenuOpen && styles.show}`}>
                <li><Link to="/menu"><MdOutlineMenuBook /> Menu</Link></li>
                <li><Link to="/rewards"><IoGift /> Rewards</Link></li>
                <li><Link to="/gift-cards"><BsFillCreditCard2FrontFill /> Gift Cards</Link></li>
                <li><Link to="/find-a-store"> <IoStorefrontSharp /> Find a Store</Link></li>
            </ul>
        </header>
    );
};

export default Navbar;