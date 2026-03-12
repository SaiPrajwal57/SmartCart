import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Store, Package, ReceiptText, TrendingUp, Trash2, Loader2, RefreshCcw, AlertCircle } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats]   = useState({ totalShops: 0, totalProducts: 0, totalBills: 0, totalRevenue: 0 });
  const [shops, setShops]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [deleting, setDeleting]   = useState(null);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    setIsLoading(true); setError(null);
    try {
      const h = { Authorization: `Bearer ${getToken()}` };
      const [sr, shopR] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers: h }),
        fetch(`${API_BASE_URL}/api/admin/shops`, { headers: h }),
      ]);
      if (!sr.ok || !shopR.ok) {
        throw new Error(sr.status === 401 || shopR.status === 401
          ? 'Access denied. Admin privileges required.'
          : 'Failed to load admin data');
      }
      setStats(await sr.json());
      setShops(await shopR.json());
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteShop = async (shopId, shopName) => {
    if (!window.confirm(`Delete shop "${shopName}" and ALL its data? This cannot be undone.`)) return;
    setDeleting(shopId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/shop/${shopId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete shop');
      setShops(prev => prev.filter(s => s._id !== shopId));
      setStats(prev => ({ ...prev, totalShops: prev.totalShops - 1 }));
    } catch (err) { alert(err.message); }
    finally { setDeleting(null); }
  };

  return (
    <div className="admin-dashboard panel-fadeIn">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={24} className="admin-icon" />
          <h2>Admin Dashboard</h2>
        </div>
        <button className="icon-btn-small" onClick={fetchData} disabled={isLoading}>
          <RefreshCcw size={16} className={isLoading ? 'spinner' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="admin-center"><Loader2 className="spinner" size={36} color="#3b82f6" /></div>
      ) : error ? (
        <div className="card admin-error">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <>
          {/* ── Stats Cards ── */}
          <div className="admin-stats-grid">
            <div className="card admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#eff6ff' }}><Store size={22} color="#3b82f6" /></div>
              <div>
                <div className="admin-stat-val">{stats.totalShops}</div>
                <div className="admin-stat-label">Total Shops</div>
              </div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#f0fdf4' }}><Package size={22} color="#16a34a" /></div>
              <div>
                <div className="admin-stat-val">{stats.totalProducts}</div>
                <div className="admin-stat-label">Total Products</div>
              </div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#fff7ed' }}><ReceiptText size={22} color="#ea580c" /></div>
              <div>
                <div className="admin-stat-val">{stats.totalBills}</div>
                <div className="admin-stat-label">Total Bills</div>
              </div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#faf5ff' }}><TrendingUp size={22} color="#7c3aed" /></div>
              <div>
                <div className="admin-stat-val">₹ {(stats.totalRevenue || 0).toLocaleString()}</div>
                <div className="admin-stat-label">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* ── Shop List ── */}
          <div className="card admin-table-card">
            <div className="admin-table-header">
              <h3>Registered Shops</h3>
              <span className="shop-count-badge">{shops.length} shops</span>
            </div>

            {shops.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem' }}>No shop owners registered yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Owner</th>
                      <th>Email</th>
                      <th style={{ textAlign: 'center' }}>Products</th>
                      <th style={{ textAlign: 'center' }}>Bills</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map(shop => (
                      <tr key={shop._id}>
                        <td className="shop-name-cell">
                          <Store size={16} className="shop-row-icon" />
                          {shop.shopName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td>{shop.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{shop.email}</td>
                        <td style={{ textAlign: 'center' }}>{shop.productCount || 0}</td>
                        <td style={{ textAlign: 'center' }}>{shop.billCount || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹ {(shop.totalRevenue || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-delete-btn"
                            onClick={() => handleDeleteShop(shop._id, shop.shopName || shop.name)}
                            disabled={deleting === shop._id}
                          >
                            {deleting === shop._id ? <Loader2 size={14} className="spinner" /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
