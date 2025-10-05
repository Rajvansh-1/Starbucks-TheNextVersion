import React, { useState } from 'react';
import styles from '../styles/LoginForm.module.css';
import { SiStarbucks } from 'react-icons/si';
import { motion } from 'framer-motion';

const LoginForm = ({ handleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        handleLogin(email, password);
    };

    const formVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 50 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 } }
    };


    return (
        <div className={styles.loginContainer}>
            <video autoPlay muted loop playsInline className={styles.backgroundVideo}>
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>
            <div className={styles.overlay}></div>

            <motion.form 
                className={styles.loginForm} 
                onSubmit={handleSubmit}
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <div className={styles.logo}>
                    <SiStarbucks />
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your Starbucks experience</p>
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} // <-- This line is now corrected
                        placeholder="Password"
                        required
                    />
                </div>
                <motion.button 
                    type="submit" 
                    className={styles.submitButton}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Sign In
                </motion.button>
                <p className={styles.extraLinks}>
                    <a href="#">Forgot Password?</a>
                    <span>&nbsp;·&nbsp;</span>
                    <a href="#">Join Now</a>
                </p>
            </motion.form>
        </div>
    );
};

export default LoginForm;