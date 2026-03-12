import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { User, Store, MapPin, Phone, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const [form, setForm]         = useState({ name: '', shopName: '', address: '', phone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const { activeShopId } = useShop();
  const { role } = useAuth(); // staff or admin might not edit shop details here

  const getToken = () => localStorage.getItem('token');

  /* ── Load profile ── */
  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        let name = '', shopName = '', address = '', phone = '';

        const resProfile = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resProfile.ok) {
          const text = await resProfile.text();
          if (text) {
              const dataProfile = JSON.parse(text);
              name = dataProfile.name || '';
              localStorage.setItem('userName', name);
          }
        }

        if (activeShopId && (role === 'owner' || role === 'admin')) {
          const resShop = await fetch(`${API_BASE_URL}/api/shops/${activeShopId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resShop.ok) {
            const dataShop = await resShop.json();
            shopName = dataShop.shopName || '';
            address  = dataShop.address || '';
            phone    = dataShop.phone || '';
          }
        }

        setForm({ name, shopName, address, phone });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeShopId, role]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /* ── Save profile ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // 1. Update Profile (User Name)
      const resProfile = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: form.name }),
      });
      if (resProfile.ok) {
        const dataProfile = await resProfile.json();
        localStorage.setItem('userName', dataProfile.name);
      }

      // 2. Update Shop Profile if Owner
      if (activeShopId && (role === 'owner' || role === 'admin')) {
        const resShop = await fetch(`${API_BASE_URL}/api/shops/${activeShopId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ shopName: form.shopName, address: form.address, phone: form.phone }),
        });
        if (!resShop.ok) {
          throw new Error('Failed to save shop details');
        }
      }

      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Loader2 className="profile-spinner" size={36} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="profile-page panel-fadeIn">
      <div className="profile-header">
        <h2>Shop Profile</h2>
        <p className="profile-subtitle">
          This information will appear on your generated bills and receipts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {error   && <div className="profile-alert error">{error}</div>}
        {success && (
          <div className="profile-alert success">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* ── Personal Info ── */}
        <div className="profile-section">
          <div className="profile-section-title">
            <User size={18} /> Personal Details
          </div>
          <div className="profile-field">
            <label>Your Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>
        </div>

        {/* ── Shop Info (Owners only) ── */}
        {(role === 'owner' || role === 'admin') && activeShopId && (
          <div className="profile-section">
            <div className="profile-section-title">
              <Store size={18} /> Active Shop Details ({form.shopName})
            </div>

            <div className="profile-field">
              <label>Shop Name</label>
              <input
                name="shopName"
                value={form.shopName}
                onChange={handleChange}
                placeholder="e.g. Sri Lakshmi General Store"
              />
            </div>

            <div className="profile-field">
              <label><MapPin size={14} /> Shop Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 12, MG Road, Bengaluru - 560001"
                rows={3}
              />
            </div>

            <div className="profile-field">
              <label><Phone size={14} /> Mobile Number</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>
        )}

        <button type="submit" className="save-btn" disabled={isSaving}>
          {isSaving ? <Loader2 className="profile-spinner" size={18} /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
