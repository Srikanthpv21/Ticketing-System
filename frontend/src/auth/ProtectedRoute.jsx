import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If a specific role is required, check it
    if (role && user.role !== role) {
        // Redirect to their appropriate dashboard
        if (user.role === 'customer') {
            return <Navigate to="/customer" replace />;
        } else if (user.role === 'agent') {
            return <Navigate to="/agent" replace />;
        } else if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
    }

    return children;
}
