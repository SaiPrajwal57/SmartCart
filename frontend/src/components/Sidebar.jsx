import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, LayoutDashboard, ReceiptText, Package, TrendingUp, PieChart, UserCircle, ShieldCheck, X, LogOut, User } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';

  const navItems = isAdmin 
    ? [
        { path: '/app/admin', name: 'Admin', icon: <ShieldCheck size={20} /> }
      ]
    : [
        ...(isOwner ? [{ path: '/app',          name: 'Dashboard',  icon: <LayoutDashboard size={20} /> }] : []),
        { path: '/app/billing',   name: 'Billing',    icon: <ReceiptText size={20} /> },
        { path: '/app/products',  name: 'Products',   icon: <Package size={20} /> },
        ...(isOwner ? [
          { path: '/app/sales',     name: 'Sales',      icon: <TrendingUp size={20} /> },
          { path: '/app/analytics', name: 'Analytics',  icon: <PieChart size={20} /> },
          { path: '/app/staff',     name: 'Staff',      icon: <UserCircle size={20} /> },
          { path: '/app/shops',     name: 'Shops',      icon: <LayoutDashboard size={20} /> },
        ] : []),
      ];

  const handleNavClick = () => { if (onClose) onClose(); };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <ShoppingCart className="logo-icon" size={28} />
          <h2 className="logo-text">SmartCart</h2>
          {/* Close button on mobile */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/app'}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  onClick={handleNavClick}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile-only user actions at bottom of sidebar */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={() => { navigate('/app/profile'); handleNavClick(); }}>
            <User size={18} /> <span>{user?.name || 'Profile'}</span>
          </button>
          <button className="sidebar-footer-btn sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

