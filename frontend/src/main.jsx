// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from "@react-oauth/google";
import RoutesComponent from './Routes'; // Adjust the path as needed
import axios from 'axios';
import "./index.css";
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthContext';

// Configure global Axios defaults
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7000';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>

        <AuthProvider>
            
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>

        <Toaster position="top-center" reverseOrder={false} />

        <RoutesComponent />

        </GoogleOAuthProvider>

        </AuthProvider>

    </React.StrictMode>
);
