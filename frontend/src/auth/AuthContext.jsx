import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Verify token and get user info
            fetchCurrentUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (token) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/auth/me/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/login/`,
                { username, password }
            );

            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setUser(userData);

            // Navigate based on role
            if (userData.role === 'customer') {
                navigate('/customer');
            } else if (userData.role === 'agent') {
                navigate('/agent');
            } else if (userData.role === 'admin') {
                navigate('/admin');
            }

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed',
            };
        }
    };

    const register = async (username, email, password, role = 'customer') => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/register/`,
                { username, email, password, role }
            );

            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setUser(userData);

            // Navigate based on role
            if (userData.role === 'customer') {
                navigate('/customer');
            } else if (userData.role === 'agent') {
                navigate('/agent');
            } else if (userData.role === 'admin') {
                navigate('/admin');
            }

            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error);
            return {
                success: false,
                error: error.response?.data || 'Registration failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
