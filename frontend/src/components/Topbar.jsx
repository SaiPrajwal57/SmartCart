import React from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import './Topbar.css';

const Topbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const { activeShopName } = useShop();
  const userName = user?.name || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar glass-panel">
      {/* Hamburger – visible only on mobile via CSS */}
      <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        {activeShopName && (
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>
            {activeShopName}
            {(role === 'owner' || role === 'admin') && (
              <span 
                onClick={() => navigate('/app/shop-selector')} 
                style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
                (Switch)
              </span>
            )}
          </span>
        )}
      </div>

      <div className="topbar-actions">
        <button className="user-btn" onClick={() => navigate('/app/profile')} title="Go to Profile">
          <User size={20} />
          <span className="user-name">{userName}</span>
        </button>
        <button className="icon-btn" onClick={handleLogout} title="Logout" style={{color: '#ef4444'}}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
