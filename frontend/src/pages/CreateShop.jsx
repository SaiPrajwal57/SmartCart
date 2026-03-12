import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Store, MapPin, Phone, Plus } from 'lucide-react';
import './CreateShop.css';

const CreateShop = () => {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const { switchShop } = useShop();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ shopName, address, phone })
      });
      const data = await response.json();
      if (response.ok) {
        switchShop(data._id, data.shopName);
        navigate('/app');
      } else {
        alert(data.message || 'Error creating shop');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="create-shop-container panel-fadeIn">
      <div className="create-shop-header">
        <Store size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
        <h2>Create Your First Shop</h2>
        <p>Set up your digital storefront parameters below.</p>
      </div>
      <form onSubmit={handleSubmit} className="create-shop-form">
        <div className="form-group">
          <label>Shop Name *</label>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="e.g. Fresh Mart" value={shopName} onChange={e => setShopName(e.target.value)} required style={{ width: '100%' }} />
          </div>
        </div>
        <div className="form-group">
          <label>Address</label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <MapPin size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
            <input type="text" placeholder="123 Main St..." value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', paddingLeft: '38px' }} />
          </div>
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
            <input type="text" placeholder="Enter contact number" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', paddingLeft: '38px' }} />
          </div>
        </div>
        <button type="submit" className="submit-shop-btn">
          <Plus size={20} /> Create Shop
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
