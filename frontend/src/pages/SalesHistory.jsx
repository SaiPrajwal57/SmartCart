import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { ReceiptText, Loader2, RefreshCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './SalesHistory.css';

const SalesHistory = () => {
  const [bills, setBills]       = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]     = useState('');

  const { activeShopId } = useShop();

  const getToken = () => localStorage.getItem('token');

  const fetchBills = async () => {
    if (!activeShopId) return;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills?shopId=${activeShopId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch sales history');
      setBills(await res.json());
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBills(); }, [activeShopId]);

  const filtered = bills.filter(b => {
    if (!search) return true;
    const dateStr = new Date(b.createdAt).toLocaleDateString();
    return dateStr.includes(search);
  });

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="sales-history panel-fadeIn">
      <div className="sales-header">
        <div className="sales-title">
          <ReceiptText size={24} className="sales-title-icon" />
          <h2>Sales History</h2>
        </div>
        <div className="sales-controls">
          <div className="sh-search-box">
            <Calendar size={16} className="sh-search-icon" />
            <input
              type="text"
              placeholder="Search by date (MM/DD/YYYY)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="icon-btn-small" onClick={fetchBills} disabled={isLoading}>
            <RefreshCcw size={16} className={isLoading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="sales-center">
          <Loader2 className="spinner" size={36} color="#3b82f6" />
        </div>
      ) : error ? (
        <div className="card"><p className="sales-error">{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className="card sales-empty">
          <ReceiptText size={56} style={{ opacity: 0.15, margin: '0 auto 1rem', display: 'block' }} />
          <p>{bills.length === 0 ? 'No bills generated yet.' : 'No bills match your search.'}</p>
        </div>
      ) : (
        <div className="bills-list">
          {filtered.map((bill, idx) => {
            const isOpen = expandedId === bill._id;
            const date   = new Date(bill.createdAt);
            return (
              <div key={bill._id} className={`bill-card card ${isOpen ? 'bill-card-open' : ''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="bill-card-header" onClick={() => toggle(bill._id)}>
                  <div className="bill-card-left">
                    <div className="bill-index">#{bills.length - idx}</div>
                    <div className="bill-meta">
                      <span className="bill-date">
                        {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="bill-time">{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="bill-card-right">
                    <div className="bill-info-chips">
                      <span className="chip chip-items">{bill.billItems?.length || 0} item(s)</span>
                      <span className={`chip chip-payment ${(bill.paymentMethod || '').toLowerCase()}`}>
                        {bill.paymentMethod || 'Cash'}
                      </span>
                    </div>
                    <div className="bill-total">₹ {(bill.totalPrice || 0).toLocaleString()}</div>
                    <button className="expand-btn">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="bill-card-body">
                    <table className="bill-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Unit Price</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bill.billItems || []).map((item, i) => (
                          <tr key={i}>
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.qty}</td>
                            <td style={{ textAlign: 'right' }}>₹ {item.price}</td>
                            <td style={{ textAlign: 'right' }}>₹ {item.qty * item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {bill.totalPrice}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
