// src/components/LoginForm.jsx
import React, { useState } from 'react';
import styles from '../styles/LoginForm.module.css';
import { SiStarbucks } from 'react-icons/si';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link

// Receive loading and error props
const LoginForm = ({ handleLogin, loading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Prevent multiple submissions while loading
        if (loading) return;

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        // Call the Appwrite login function passed via props
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

                {/* Display error message if there is one */}
                {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

                <div className={styles.inputGroup}>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <motion.button
                    type="submit"
                    className={styles.submitButton}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading} // Disable button while loading
                >
                    {/* Show different text based on loading state */}
                    {loading ? 'Signing In...' : 'Sign In'}
                </motion.button>
                 <p className={styles.extraLinks}>
                    <a href="#">Forgot Password?</a>
                    <span>&nbsp;·&nbsp;</span>
                    {/* Link to your signup page */}
                    <Link to="/signup">Join Now</Link> {/* Use Link component */}
                </p>
            </motion.form>
        </div>
    );
};

export default LoginForm;