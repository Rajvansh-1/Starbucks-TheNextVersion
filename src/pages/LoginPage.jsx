// src/pages/LoginPage.jsx
import React from 'react';
import LoginForm from '../components/LoginForm';

// Receive loading and error props
const LoginPage = ({ handleLogin, loading, error }) => {
    // Pass them down to LoginForm
    return <LoginForm handleLogin={handleLogin} loading={loading} error={error} />;
};

export default LoginPage;