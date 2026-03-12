import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Loader2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Analytics.css';

const COLORS      = ['#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#f97316'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Analytics = () => {
  const [mostSold,   setMostSold]   = useState([]);
  const [leastSold,  setLeastSold]  = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  const { activeShopId } = useShop();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchAll = async () => {
      if (!activeShopId) return;
      setIsLoading(true); setError(null);
      try {
        const token = getToken();
        const h = { Authorization: `Bearer ${token}` };
        const params = `?shopId=${activeShopId}`;
        const [r1, r2, r3, r4] = await Promise.all([
          fetch(`/api/analytics/most-sold${params}`,    { headers: h }),
          fetch(`/api/analytics/least-sold${params}`,   { headers: h }),
          fetch(`/api/analytics/daily-sales${params}`,  { headers: h }),
          fetch(`/api/analytics/monthly-sales${params}`,{ headers: h }),
        ]);
        if (!r1.ok || !r2.ok || !r3.ok || !r4.ok) throw new Error('Failed to load analytics');

        const [ms, ls, ds, mns] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()]);
        setMostSold(ms);
        setLeastSold(ls);
        setDailySales(ds.map(d => ({
          name: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          revenue: d.revenue,
          bills: d.bills,
        })));
        setMonthlySales(mns.map(m => {
          const [year, month] = m._id.split('-');
          return { name: `${MONTH_NAMES[parseInt(month, 10) - 1]} '${year.slice(2)}`, revenue: m.revenue, bills: m.bills };
        }));
      } catch (err) { setError(err.message); }
      finally { setIsLoading(false); }
    };
    fetchAll();
  }, [activeShopId]);

  if (isLoading) return (
    <div className="analytics-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Loader2 className="spinner" size={40} color="#3b82f6" />
    </div>
  );

  if (error) return (
    <div className="analytics-page panel-fadeIn">
      <div className="card" style={{ padding: '2rem', color: '#ef4444' }}>Error: {error}</div>
    </div>
  );

  const pieData = mostSold.slice(0, 5).map(p => ({ name: p.name || 'Unknown', value: p.totalQuantitySold || 0 }));

  return (
    <div className="analytics-page panel-fadeIn">
      <div className="analytics-page-header">
        <BarChart2 size={22} style={{ color: 'var(--accent-primary)' }} />
        <h2>Analytics Overview</h2>
      </div>

      <div className="analytics-grid">

        {/* ── Most Sold + Pie Chart ── */}
        <div className="card glass-panel analytics-hero">
          <div className="hero-stats">
            <h3>Most Sold Products</h3>
            {mostSold.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No sales data yet.</p>
            ) : (
              <ol className="best-seller-list">
                {mostSold.slice(0, 5).map((p, i) => (
                  <li key={i}>
                    <span className="num">{i + 1}.</span>
                    {p.name || 'Unknown'}
                    <span className="stat-value-sm" style={{ color: 'var(--accent-primary)' }}>
                      {p.totalQuantitySold} sold
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="pie-wrapper">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* ── Least Sold ── */}
        <div className="card analytics-list-card">
          <div className="an-card-header">
            <TrendingDown size={18} style={{ color: '#ef4444' }} />
            <h3>Least Sold Products</h3>
          </div>
          {leastSold.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No sales data yet.</p>
          ) : (
            <ul className="an-product-list">
              {leastSold.slice(0, 7).map((p, i) => (
                <li key={i}>
                  <span className="an-name">{p.name || 'Unknown'}</span>
                  <span className="an-badge danger">{p.totalQuantitySold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Daily Sales Chart ── */}
        <div className="card chart-card wide-card">
          <div className="chart-header">
            <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3>Daily Revenue (Last 7 Days)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales.length > 0 ? dailySales : [{ name: 'No data', revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={v => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="revenue" fill="url(#colorSales)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Monthly Sales Chart ── */}
        <div className="card chart-card wide-card">
          <div className="chart-header">
            <BarChart2 size={18} style={{ color: '#8b5cf6' }} />
            <h3>Monthly Revenue (Last 12 Months)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales.length > 0 ? monthlySales : [{ name: 'No data', revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={v => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
