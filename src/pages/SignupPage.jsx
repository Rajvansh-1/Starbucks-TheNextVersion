// src/pages/SignupPage.jsx
import React from 'react';
import SignupForm from '../components/SignupForm';

const SignupPage = ({ handleSignup, loading, error }) => {
    return <SignupForm handleSignup={handleSignup} loading={loading} error={error} />;
};

export default SignupPage;