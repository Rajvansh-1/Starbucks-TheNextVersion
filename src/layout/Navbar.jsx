// src/layout/Navbar.jsx
import React, { useState } from 'react';
import styles from '../styles/Navbar.module.css';
import { FaUserCircle, FaShoppingBag, FaClipboardList } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { AiOutlineClose, AiOutlineSearch, AiOutlineLogout } from 'react-icons/ai';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMenuBook } from 'react-icons/md';
import { IoGift, IoStorefrontSharp } from 'react-icons/io5';
import { BsFillCreditCard2FrontFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ currentUser, handleLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

    const userMenuVariants = {
        hidden: { opacity: 0, y: -20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } }
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
                        <motion.button
                            className={styles.findStoreButton}
                            onClick={() => navigate('/find-a-store')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaLocationDot /> Find a Store
                        </motion.button>

                        {currentUser ? (
                            <div className={styles.userProfile}>
                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <FaUserCircle
                                        className={styles.userIcon}
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    />
                                </motion.div>
                                <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        className={styles.userMenu}
                                        variants={userMenuVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <div className={styles.userInfo}>
                                            <FaUserCircle className={styles.menuUserIcon} />
                                            {/* Display user name from Appwrite */}
                                            <span>{currentUser.name}</span>
                                        </div>
                                        {/* You can add more user-specific links here if needed */}
                                        <Link to="/bag" className={styles.userMenuItem}><FaShoppingBag /> My Bag</Link>
                                        <Link to="/orders" className={styles.userMenuItem}><FaClipboardList /> My Orders</Link>
                                        <div className={styles.userMenuItem} onClick={handleLogout}>
                                            <AiOutlineLogout /> Logout
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <>
                                <motion.button
                                    className={styles.signIn}
                                    onClick={() => navigate('/login')}
                                    whileHover={buttonHover}
                                >
                                    Sign In
                                </motion.button>

                                <motion.button
                                    // Navigate to the signup page
                                    onClick={() => navigate('/signup')}
                                    whileHover={buttonHover}
                                >
                                    Join Now
                                </motion.button>
                            </>
                        )}
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
                 {/* Optionally add mobile login/signup links */}
                {!currentUser && (
                    <>
                        <li><Link to="/login">Sign In</Link></li>
                        <li><Link to="/signup">Join Now</Link></li>
                    </>
                )}
                 {currentUser && (
                    <li><div onClick={handleLogout} style={{ padding: '15px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><AiOutlineLogout style={{ marginRight: '15px'}} /> Logout</div></li>
                 )}
            </ul>
        </header>
    );
};

export default Navbar;