import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, LayoutDashboard, ReceiptText, Package, TrendingUp, PieChart, UserCircle, ShieldCheck } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isStaff = role === 'staff';

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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ShoppingCart className="logo-icon" size={28} />
        <h2 className="logo-text">SmartCart</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

