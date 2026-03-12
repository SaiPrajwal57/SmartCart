import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Lock, Loader2, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Dashboard.css';

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { activeShopId, activeShopName } = useShop();

  const fetchStaff = async () => {
    if (!activeShopId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff?shopId=${activeShopId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch staff');
      setStaffList(await res.json());
    } catch (err) {
      // Ignore staff fetch error if backend not ready, just show empty list
      console.error(err);
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeShopId]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!activeShopId) return setError("No active shop selected.");
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ ...form, shopId: activeShopId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add staff');
      
      setSuccess('Staff member added successfully!');
      setForm({ name: '', email: '', password: '' });
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}?shopId=${activeShopId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to remove staff');
      setStaffList(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!activeShopId) return <div className="dashboard" style={{padding: '2rem'}}>Please select a shop first.</div>;

  return (
    <div className="dashboard panel-fadeIn">
      <div className="stat-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={28} style={{ color: '#3b82f6' }} />
          <div>
            <h2 style={{ margin: 0 }}>Staff Management</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Managing staff for: <strong>{activeShopName}</strong></p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        
        {/* ADD STAFF FORM */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Add New Staff</h3>
          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ background: '#dcfce3', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}
          
          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Full Name</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', gap: '8px' }}>
                <User size={18} color="#94a3b8" />
                <input 
                  type="text" name="name" value={form.name} onChange={handleChange} required
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem' }} placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', gap: '8px' }}>
                <Mail size={18} color="#94a3b8" />
                <input 
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem' }} placeholder="staff@shop.com"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', gap: '8px' }}>
                <Lock size={18} color="#94a3b8" />
                <input 
                  type="password" name="password" value={form.password} onChange={handleChange} required minLength="6"
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem' }} placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {isSaving ? <Loader2 size={18} className="spinner" /> : <UserPlus size={18} />}
              {isSaving ? 'Adding...' : 'Add Staff Member'}
            </button>
          </form>
        </div>

        {/* STAFF LIST */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Current Staff</h3>
          
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="spinner" size={24} color="#3b82f6" /></div>
          ) : staffList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No staff members found for this shop.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {staffList.map(staff => (
                <div key={staff._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{staff.name}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{staff.email}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Shop: {activeShopName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(staff._id)}
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Remove Staff"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default StaffManagement;
