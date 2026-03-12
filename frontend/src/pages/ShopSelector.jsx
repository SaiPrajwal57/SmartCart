import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Store, MapPin, Plus, Loader2 } from 'lucide-react';
import './ShopSelector.css'; 

const ShopSelector = () => {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { switchShop } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (response.ok) {
          setShops(data);
          if (data.length === 0) {
            navigate('/app/welcome');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShops();
  }, [navigate]);

  const handleSelect = (shop) => {
    switchShop(shop._id, shop.shopName);
    navigate('/app');
  };

  return (
    <div className="shop-selector-container panel-fadeIn">
      <div className="shop-selector-header">
        <h2>Select Your Shop</h2>
        <p>Choose a storefront to manage your products and view analytics.</p>
      </div>

      {isLoading ? (
        <div className="shop-selector-loader">
          <Loader2 className="spinner" size={40} color="#3b82f6" />
          <p>Loading your shops...</p>
        </div>
      ) : (
        <div className="shops-grid">
          {shops.map(shop => (
            <div key={shop._id} className="shop-card" onClick={() => handleSelect(shop)}>
              <div className="shop-icon-circle">
                <Store size={24} />
              </div>
              <h3>{shop.shopName}</h3>
              {shop.address && (
                <div className="shop-detail">
                  <MapPin size={16} /> <span>{shop.address}</span>
                </div>
              )}
            </div>
          ))}
          
          <div className="add-new-shop-btn" onClick={() => navigate('/app/create-shop')}>
            <Plus size={32} />
            <span>Add New Shop</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopSelector;
