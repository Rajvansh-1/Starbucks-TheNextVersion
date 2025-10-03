import React, { useState } from 'react';
import styles from '../styles/LoginForm.module.css';
import { SiStarbucks } from 'react-icons/si';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        console.log('Logging in with:', { email, password });
        alert(`Welcome back! (Simulated Login for ${email})`);
        // Here you would typically handle authentication logic
    };

    return (
        <div className={styles.loginContainer}>
            <form className={styles.loginForm} onSubmit={handleSubmit}>
                <div className={styles.logo}>
                    <SiStarbucks />
                    <h2>Sign In</h2>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className={styles.submitButton}>
                    Sign In
                </button>
                <p className={styles.forgotPassword}>
                    <a href="#">Forgot your password?</a>
                </p>
            </form>
        </div>
    );
};

export default LoginForm;