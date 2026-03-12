import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useShop } from '../context/ShopContext';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState({
    totalBills: 0,
    totalProducts: 0,
    totalRevenue: 0,
    mostSoldProducts: [],
    dailyRevenue: [] // { _id: "2023-10-27", revenue: 150 }
  });
  
  // Also fetch generic products to figure out low stock alerts
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { activeShopId } = useShop();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeShopId) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch analytics
        const analyticsRes = await fetch(`${API_BASE_URL}/api/analytics?shopId=${activeShopId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await analyticsRes.json();
        
        setData(analyticsData);

        // Use dedicated low-stock endpoint (threshold: stock < 5)
        const lowStockRes = await fetch(`${API_BASE_URL}/api/products/low-stock?shopId=${activeShopId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!lowStockRes.ok) throw new Error('Failed to fetch low stock');
        const lowStockData = await lowStockRes.json();
        setLowStockAlerts(lowStockData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeShopId]);

  // Format chart data
  const chartData = data.dailyRevenue.map(item => {
      // item._id is likely a date string like 'YYYY-MM-DD'
      const dateLabel = item._id ? new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
      return {
          name: dateLabel,
          sales: item.revenue
      };
  });
  
  // Provide empty placeholder if no chart data
  const finalChartData = chartData.length > 0 ? chartData : [
      { name: 'Mon', sales: 0 }, { name: 'Tue', sales: 0 }, { name: 'Wed', sales: 0 },
      { name: 'Thu', sales: 0 }, { name: 'Fri', sales: 0 }, { name: 'Sat', sales: 0 }, { name: 'Sun', sales: 0 }
  ];

  if (isLoading) {
      return (
          <div className="dashboard" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
              <Loader2 className="spinner" size={48} color="#3b82f6" />
          </div>
      );
  }

  if (error) {
      return (
          <div className="dashboard" style={{padding: '2rem'}}>
             <div className="card alert-card">
                 <h3 style={{color: '#ef4444'}}>Error Loading Dashboard</h3>
                 <p>{error}</p>
             </div>
          </div>
      );
  }

  return (
    <div className="dashboard panel-fadeIn">
      <div className="dashboard-grid">
        
        {/* Today's Sales Card - For simplicity right now, using totalRevenue */}
        <div className="card hero-card">
          <div className="hero-content">
            <h3>Total Sales Revenue</h3>
            <h1>₹ {data.totalRevenue.toLocaleString()}</h1>
            <p>Your overall revenue from {data.totalBills} bills.</p>
          </div>
          <div className="hero-bg-graphic"></div>
        </div>

        {/* Total Products Card */}
        <div className="card stat-card">
          <div className="stat-header">
            <h3>Total Products</h3>
            <span className="trend positive"><TrendingUp size={16}/> Active</span>
          </div>
          <div className="stat-value">
            <h2>{data.totalProducts}</h2>
            <div className="stat-icon-wrapper">
              <Package size={24} className="stat-icon" />
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card list-card list-card-tall">
          <h3>Top Selling Items</h3>
          {data.mostSoldProducts && data.mostSoldProducts.length > 0 ? (
              <ul className="selling-list">
                {data.mostSoldProducts.map((item, index) => {
                    // Max total revenue logic for bar width (just an estimation against 1st item)
                    const maxQty = data.mostSoldProducts[0].totalQuantitySold;
                    const percent = Math.max(10, Math.round((item.totalQuantitySold / maxQty) * 100));
                    
                    return (
                        <li key={index}>
                          <div className="item-info"><span>{item.name || 'Unnamed Product'}</span> <span className="item-count">{item.totalQuantitySold} sold</span></div>
                          <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width: `${percent}%`}}></div></div>
                          <div className="item-price">₹ {item.totalRevenueGenerated}</div>
                        </li>
                    )
                })}
              </ul>
          ) : (
             <p style={{color: 'var(--text-muted)', paddingTop: '1rem', fontStyle: 'italic'}}>No sales data available yet.</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card alert-card">
          <h3>Low Stock Alerts</h3>
          <div className="alerts-container">
            {lowStockAlerts.length > 0 ? (
                lowStockAlerts.map(alert => (
                    <div className="alert-item" key={alert._id}>
                      <AlertCircle size={18} className={alert.stock <= 5 ? "alert-icon danger" : "alert-icon warning"} />
                      <span><strong>{alert.name}</strong> ({alert.stock} left)</span>
                    </div>
                ))
            ) : (
                <p style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>All products are adequately stocked.</p>
            )}
          </div>
        </div>

        {/* Sales Chart */}
        <div className="card chart-card wide-card">
          <div className="chart-header">
            <h3>Sales Trend (Last 7 Days)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)'}} />
                <Bar dataKey="sales" fill="url(#colorSales)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
