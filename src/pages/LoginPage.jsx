import React from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage = ({ handleLogin }) => {
    return <LoginForm handleLogin={handleLogin} />;
};

export default LoginPage;