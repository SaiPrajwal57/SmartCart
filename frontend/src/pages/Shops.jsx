import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, MapPin, Phone, Loader2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Dashboard.css';

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { switchShop, activeShopId } = useShop();

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shops', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch shops');
      setShops(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSwitch = (shop) => {
    switchShop(shop._id, shop.shopName);
    navigate('/app');
  };

  if (isLoading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Loader2 className="spinner" size={36} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="dashboard panel-fadeIn">
      <div className="stat-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Store size={28} style={{ color: '#3b82f6' }} />
          <h2 style={{ margin: 0 }}>My Shops</h2>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/app/create-shop')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}>
          <Plus size={16} /> Add New Shop
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {shops.map(shop => {
          const isActive = shop._id === activeShopId;
          return (
            <div key={shop._id} className="card stat-card" style={{ border: isActive ? '2px solid #3b82f6' : 'none' }}>
              <div className="stat-header">
                <h3>{shop.shopName}</h3>
                {isActive && <span className="trend positive" style={{ fontSize: '0.75rem' }}>Active</span>}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> {shop.address || 'No address provided'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} /> {shop.phone || 'No phone provided'}
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button 
                  className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => handleSwitch(shop)}
                  disabled={isActive}
                >
                  {isActive ? 'Currently Active' : 'Switch to this Shop'} {!isActive && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shops;
