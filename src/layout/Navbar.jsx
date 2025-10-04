import React, { useState } from 'react';
import styles from '../styles/Navbar.module.css';
import { FaLocationDot } from "react-icons/fa6";
import { AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMenuBook } from 'react-icons/md';
import { IoGift, IoStorefrontSharp } from 'react-icons/io5';
import { BsFillCreditCard2FrontFill } from 'react-icons/bs';
import { motion } from 'framer-motion';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const linkHover = {
        scale: 1.1,
        transition: { type: 'spring', stiffness: 300 }
    };

    const buttonHover = {
        scale: 1.05,
        backgroundColor: "var(--highlight-color)",
        color: "var(--primary-background)",
        transition: { type: 'spring', stiffness: 300 }
    };

    return (
        <header className={styles.header}>
            <nav className={styles.navbar_main_container}>
                <motion.img 
                    src="https://res.cloudinary.com/dvmuf6jfj/image/upload/v1720633150/Starbucks/22_xavkyq.png" 
                    alt="logo" 
                    className={styles.logo} 
                    onClick={() => navigate('/')} 
                    style={{cursor: 'pointer'}}
                    whileHover={{ rotate: 360, transition: { duration: 1 } }}
                />

                <div className={`${styles.navbar_content_container} ${isMenuOpen ? styles.open : ''}`}>
                    <motion.div className={styles.branding_items}>
                        <motion.div whileHover={linkHover}><Link to="/menu">Menu</Link></motion.div>
                        <motion.div whileHover={linkHover}><Link to="/rewards">Rewards</Link></motion.div>
                        <motion.div whileHover={linkHover}><Link to="/gift-cards">Gift Cards</Link></motion.div>
                    </motion.div>

                    <motion.div className={styles.user_items}>
                        <motion.div whileHover={linkHover} className={styles.findStoreLink}>
                            <Link to="/find-a-store"><FaLocationDot /> Find a Store</Link>
                        </motion.div>
                        
                        <motion.button 
                            className={styles.signIn} 
                            onClick={() => navigate('/login')}
                            whileHover={buttonHover}
                        >
                            Sign In
                        </motion.button>
                        
                        <motion.button 
                            onClick={() => navigate('/join')}
                            whileHover={buttonHover}
                        >
                            Join Now
                        </motion.button>
                    </motion.div>
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