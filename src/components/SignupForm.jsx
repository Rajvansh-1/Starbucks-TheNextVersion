// src/components/SignupForm.jsx
import React, { useState } from 'react';
// Reuse the login form styles or create a new one (SignupForm.module.css)
import styles from '../styles/LoginForm.module.css'; // Reusing login styles for simplicity
import { SiStarbucks } from 'react-icons/si';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link

const SignupForm = ({ handleSignup, loading, error }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;

        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        // Call the Appwrite signup function passed via props
        handleSignup(email, password, name);
    };

    const formVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 50 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 } }
    };

    return (
        <div className={styles.loginContainer}> {/* Use loginContainer style */}
            <video autoPlay muted loop playsInline className={styles.backgroundVideo}>
                <source src="/login-bg.mp4" type="video/mp4" /> {/* Assuming same background */}
            </video>
            <div className={styles.overlay}></div>

            <motion.form
                className={styles.loginForm} // Use loginForm style
                onSubmit={handleSubmit}
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <div className={styles.logo}>
                    <SiStarbucks />
                    <h2>Join Starbucks® Rewards</h2>
                    <p>Create an account to start earning stars.</p>
                </div>

                {/* Display error message if there is one */}
                {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        required
                        disabled={loading}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>
                 <div className={styles.inputGroup}>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        required
                        disabled={loading}
                    />
                </div>
                <motion.button
                    type="submit"
                    className={styles.submitButton}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
                <p className={styles.extraLinks}>
                    Already have an account?&nbsp;
                    {/* Link back to the login page */}
                    <Link to="/login">Sign In</Link>
                </p>
            </motion.form>
        </div>
    );
};

export default SignupForm;