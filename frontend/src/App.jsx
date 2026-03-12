import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SalesHistory from './pages/SalesHistory';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateShop from './pages/CreateShop';
import ShopSelector from './pages/ShopSelector';
import Shops from './pages/Shops';
import StaffManagement from './pages/StaffManagement';
import Welcome from './pages/Welcome';
import LandingPage from './pages/LandingPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return token ? children : <Navigate to="/login" replace />;
};

const OwnerRoute = ({ children }) => {
  const { token, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'owner' && role !== 'admin') return <Navigate to="/app" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/app" replace />;
  return children;
};

const IndexRoute = () => {
  const { role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (role === 'admin') return <Navigate to="/app/admin" replace />;
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <Router>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected App Routes under /app */}
            <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<IndexRoute />} />
              <Route path="billing" element={<Billing />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<SalesHistory />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Owner Routes */}
              <Route path="analytics" element={<OwnerRoute><Analytics /></OwnerRoute>} />
              <Route path="welcome" element={<OwnerRoute><Welcome /></OwnerRoute>} />
              <Route path="create-shop" element={<OwnerRoute><CreateShop /></OwnerRoute>} />
              <Route path="shop-selector" element={<OwnerRoute><ShopSelector /></OwnerRoute>} />
              <Route path="shops" element={<OwnerRoute><Shops /></OwnerRoute>} />
              <Route path="staff" element={<OwnerRoute><StaffManagement /></OwnerRoute>} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;

