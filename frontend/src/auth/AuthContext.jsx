
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from './authContextObject';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');

        if (token) {
            fetchCurrentUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (token) => {
        try {
            const response = await api.get('/auth/me/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error.response?.data || error.message);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const navigateByRole = (userData) => {
        if (userData.role === 'customer') navigate('/customer');
        else if (userData.role === 'agent') navigate('/agent');
        else if (userData.role === 'admin') navigate('/admin');
    };

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', {
                username,
                password,
            });

            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setUser(userData);
            navigateByRole(userData);

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed',
            };
        }
    };

    const register = async (username, email, password, role = 'customer') => {
        try {
            const response = await api.post('/auth/register/', {
                username,
                email,
                password,
                role,
            });

            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setUser(userData);
            navigateByRole(userData);

            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error.response?.data || error.message);
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

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            updateUser: setUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
