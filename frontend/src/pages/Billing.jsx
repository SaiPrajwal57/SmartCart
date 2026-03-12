import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, Loader2, X, ShoppingCart, CreditCard, Banknote, Smartphone, Package } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Billing.css';

const PAYMENT_METHODS = [
  { id: 'Cash',  label: 'Cash',  icon: Banknote },
  { id: 'Card',  label: 'Card',  icon: CreditCard },
  { id: 'UPI',   label: 'UPI',   icon: Smartphone },
];

const Billing = () => {
  const [products, setProducts]         = useState([]);
  const [cart, setCart]                 = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [shopProfile, setShopProfile]   = useState({ shopName: '', address: '', phone: '' });

  // Bill confirmation modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [generatedBill, setGeneratedBill] = useState(null);

  const { activeShopId } = useShop();

  const receiptRef = useRef(null);

  /* ── fetch products + shop profile in parallel ── */
  const fetchProducts = async () => {
    if (!activeShopId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, profileRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products?shopId=${activeShopId}`, { headers }),
        fetch(`${API_BASE_URL}/api/shops/${activeShopId}`, { headers }),
      ]);
      if (!prodRes.ok) throw new Error('Failed to fetch products');
      setProducts(await prodRes.json());
      if (profileRes.ok) {
        const p = await profileRes.json();
        setShopProfile({ shopName: p.shopName || '', address: p.address || '', phone: p.phone || '' });
      } else {
        // Fallback if shop endpoint not fully ready
        setShopProfile({ shopName: 'My Shop', address: '', phone: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [activeShopId]);

  /* ── cart helpers ──
   * cartKey = productId + '|' + packageLabel (or '|base' for no packaging)
   * This allows the same product in different packaging sizes to coexist.
   */
  const addToCart = (product, pkg = null) => {
    const cartKey = pkg ? `${product._id}|${pkg.label}` : `${product._id}|base`;
    const price   = pkg ? pkg.price : product.price;
    const label   = pkg ? pkg.label : null;
    const name    = pkg ? `${product.name} (${pkg.label})` : product.name;
    // pkgQuantity: the numeric size of the package (e.g. 500 for 500g, 1 for 1kg).
    // The backend multiplies this by qty to compute how much to deduct from stock.
    // 0 means base/loose — backend just deducts qty directly.
    const pkgQuantity = pkg ? (Number(pkg.quantity) || 0) : 0;

    setCart(prev => {
      const ex = prev.find(i => i.cartKey === cartKey);
      if (ex) {
        if (ex.qty >= product.stock) return prev;
        return prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i);
      }
    return [
        ...prev,
        {
          cartKey,
          product: product._id,
          name,
          price,
          qty: 1,
          stock:        product.stock,
          packageLabel: label,
          pkgQuantity,
          unitType:     product.unitType || 'piece',  // carry unit for display
        },
      ];
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const nq = i.qty + delta;
      return (nq > 0 && nq <= i.stock) ? { ...i, qty: nq } : i;
    }));
  };

  // For loose items: allow free typing (store raw string), parse to number on blur
  const setLooseQty = (cartKey, val) => {
    // Store the raw string so the user can clear & retype (e.g. clear "1" → type "2")
    setCart(prev => prev.map(i =>
      i.cartKey === cartKey ? { ...i, qty: val } : i
    ));
  };

  const commitLooseQty = (cartKey) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      let num = parseFloat(i.qty);
      if (isNaN(num) || num <= 0) num = 0.01;
      if (num > i.stock) num = i.stock;          // clamp to available stock
      return { ...i, qty: num };
    }));
  };

  const removeItem = (cartKey) => setCart(prev => prev.filter(i => i.cartKey !== cartKey));

  const total = parseFloat(cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));


  /* ── generate bill ── */
  const handleGenerateBill = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Map cart to the billItems shape the backend expects
      const billItems = cart.map(i => ({
        product:      i.product,
        name:         i.name,
        qty:          i.qty,
        price:        i.price,
        packageLabel: i.packageLabel || null,   // null = loose; string = which packaging stock to deduct
        pkgQuantity:  i.pkgQuantity || 0,
      }));
      const res = await fetch(`${API_BASE_URL}/api/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ billItems, paymentMethod, totalPrice: total, shopId: activeShopId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate bill');

      setGeneratedBill({ ...data, cartSnapshot: cart, paymentMethod, total });
      fetchProducts(); // refresh stock
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── print receipt ── */
  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Receipt</title><style>
        body{font-family:monospace;padding:24px;max-width:320px;margin:auto}
        h2{text-align:center;margin:0 0 4px}
        .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 0;font-size:13px}
        td:last-child{text-align:right}
        .divider{border-top:1px dashed #ccc;margin:8px 0}
        .total{font-weight:bold;font-size:15px}
        .footer{text-align:center;margin-top:16px;font-size:12px;color:#888}
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  /* ── close & reset after bill ── */
  const resetBilling = () => {
    setCart([]);
    setGeneratedBill(null);
    setShowBillModal(false);
    setPaymentMethod('Cash');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div className="billing-container">
      {/* ── Bill Confirmation / Receipt Modal ── */}
      {showBillModal && (
        <div className="bill-modal-overlay" onClick={() => !isSubmitting && resetBilling()}>
          <div className="bill-modal-card" onClick={e => e.stopPropagation()}>
            {generatedBill ? (
              /* ── SUCCESS: Show receipt ── */
              <>
                <div className="bill-modal-header success-header">
                  <CheckCircle size={28} className="success-icon" />
                  <h3>Bill Generated!</h3>
                  <button className="modal-x-btn" onClick={resetBilling}><X size={18} /></button>
                </div>

                {/* Printable receipt */}
                <div ref={receiptRef} className="receipt">
                  <h2>{shopProfile.shopName || 'My Shop'}</h2>
                  {shopProfile.address && (
                    <div className="sub receipt-address">{shopProfile.address}</div>
                  )}
                  {shopProfile.phone && (
                    <div className="sub">📞 {shopProfile.phone}</div>
                  )}
                  <div className="sub" style={{ marginTop: '4px' }}>Tax Invoice</div>

                  <div className="receipt-meta">
                    <span>Date: {new Date().toLocaleDateString()}</span>
                    <span>Time: {new Date().toLocaleTimeString()}</span>
                  </div>

                  <div className="receipt-divider" />

                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <td><b>Item</b></td>
                        <td style={{ textAlign: 'center' }}><b>Qty</b></td>
                        <td style={{ textAlign: 'right' }}><b>Amount</b></td>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedBill.cartSnapshot.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>{item.qty} × ₹{item.price}</td>
                          <td style={{ textAlign: 'right' }}>₹{item.price * item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="receipt-divider" />
                  <div className="receipt-total-row">
                    <span>Total</span>
                    <span>₹ {generatedBill.total}</span>
                  </div>
                  <div className="receipt-payment-row">
                    <span>Payment</span>
                    <span>{generatedBill.paymentMethod}</span>
                  </div>
                  <div className="receipt-divider" />
                  <div className="receipt-footer">Thank you for shopping! 🛒</div>
                </div>

                <div className="bill-modal-actions">
                  <button className="btn-bill btn-bill-outline" onClick={resetBilling}>New Bill</button>
                  <button className="btn-bill btn-bill-primary" onClick={handlePrint}>
                    <Printer size={16} /> Print Receipt
                  </button>
                </div>
              </>
            ) : (
              /* ── CONFIRM: Payment method + summary ── */
              <>
                <div className="bill-modal-header">
                  <ShoppingCart size={22} />
                  <h3>Confirm Bill</h3>
                  <button className="modal-x-btn" onClick={() => setShowBillModal(false)}><X size={18} /></button>
                </div>

                {error && <div className="bill-modal-error">{error}</div>}

                <div className="confirm-items">
                  {cart.map(item => (
                    <div key={item.cartKey} className="confirm-item-row">
                      <span className="confirm-item-name">{item.name} × {item.qty}</span>
                      <span className="confirm-item-price">₹ {item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="confirm-total-bar">
                  <span>Total</span>
                  <span>₹ {total}</span>
                </div>

                <div className="payment-method-section">
                  <p className="payment-label">Select Payment Method</p>
                  <div className="payment-methods-grid">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        className={`payment-method-btn ${paymentMethod === id ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod(id)}
                      >
                        <Icon size={20} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bill-modal-actions">
                  <button className="btn-bill btn-bill-outline" onClick={() => setShowBillModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn-bill btn-bill-primary"
                    onClick={handleGenerateBill}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="spinner" size={16} /> : <CheckCircle size={16} />}
                    {isSubmitting ? 'Processing...' : 'Confirm & Generate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="billing-grid">

        {/* Left — Products */}
        <div className="card products-selection panel-fadeIn">
          <div className="search-header">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search item by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="products-grid">
            {isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                <Loader2 className="spinner" size={24} color="#3b82f6" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>
                {products.length === 0 ? 'No products yet. Add products first!' : 'No products match your search.'}
              </div>
            ) : (
              filteredProducts.map(product => {
                const hasPkg = product.packagingOptions && product.packagingOptions.length > 0;
                return (
                  <div
                    key={product._id}
                    className={`product-item ${product.stock === 0 ? 'out-of-stock' : ''} ${hasPkg ? 'has-packaging' : ''}`}
                  >
                    <div className="prod-info">
                      <h4>{product.name}</h4>
                      <div className="prod-meta-row">
                        <span className="prod-price">₹ {product.price}</span>
                        {product.category && (
                          <span className="prod-category-chip">{product.category}</span>
                        )}
                      </div>
                      <span className={`stock-badge ${product.stock < 5 ? 'danger' : product.stock < 10 ? 'low' : ''}`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                      </span>
                    </div>

                    {product.stock > 0 && (
                      hasPkg ? (
                        /* ── Packaging options as chips ── */
                        <div className="pkg-options-row">
                          {/* Base/loose option (always available) */}
                          <button
                            className="pkg-chip pkg-chip-base"
                            onClick={() => addToCart(product, null)}
                            title={`Add base — ₹${product.price}`}
                          >
                            <Package size={12} />
                            Loose · ₹{product.price}
                          </button>

                          {product.packagingOptions.map((pkg, i) => {
                            const pkgStock = pkg.stock ?? 0;
                            return (
                              <button
                                key={i}
                                className={`pkg-chip ${pkgStock === 0 ? 'pkg-chip-oos' : ''}`}
                                onClick={() => pkgStock > 0 && addToCart(product, pkg)}
                                disabled={pkgStock === 0}
                                title={pkgStock === 0 ? 'Out of stock' : `Add ${pkg.label} — ₹${pkg.price}`}
                              >
                                {pkg.label} · ₹{pkg.price}
                                <span className={`pkg-chip-stock ${pkgStock < 5 ? 'low' : ''}`}>
                                  {pkgStock === 0 ? 'OOS' : pkgStock}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* ── No packaging: simple add button ── */
                        <button className="add-btn" onClick={() => addToCart(product)}>
                          <Plus size={16} />
                        </button>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Current Bill */}
        <div className="card current-bill panel-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h3>Current Order</h3>

          {error && !showBillModal && (
            <div className="error-message" style={{ margin: '0.75rem 0' }}>{error}</div>
          )}

          <div className="bill-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={36} opacity={0.3} />
                <p>Cart is empty</p>
                <span>Click a product to add it</span>
              </div>
            ) : (
              cart.map(item => {
                const isLoose = !item.packageLabel; // loose = no packaging label
                return (
                  <div key={item.cartKey} className="bill-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      {isLoose ? (
                        <span className="item-unit-price">
                          ₹ {item.price} / {item.unitType || 'unit'}
                        </span>
                      ) : (
                        <span className="item-unit-price">₹ {item.price} each</span>
                      )}
                    </div>
                    <div className="item-actions">
                      {isLoose ? (
                        /* ── Loose: direct decimal input ── */
                        <div className="loose-qty-input-wrap">
                          <input
                            type="number"
                            className="loose-qty-input"
                            value={item.qty}
                            min="0.01"
                            step="0.01"
                            max={item.stock}
                            onChange={e => setLooseQty(item.cartKey, e.target.value)}
                            onBlur={() => commitLooseQty(item.cartKey)}
                          />
                          <span className="loose-qty-unit">{item.unitType || 'unit'}</span>
                        </div>
                      ) : (
                        /* ── Packaged: integer +/- buttons ── */
                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => updateQty(item.cartKey, -1)}><Minus size={14} /></button>
                          <span>{item.qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(item.cartKey, 1)}><Plus size={14} /></button>
                        </div>
                      )}
                      <span className="item-total">₹ {(item.price * item.qty).toFixed(2)}</span>
                      <button className="delete-btn" onClick={() => removeItem(item.cartKey)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bill-summary">
            <div className="total-row">
              <span>Total</span>
              <span>₹ {total}</span>
            </div>
            <button
              className="btn btn-primary btn-large"
              disabled={cart.length === 0}
              onClick={() => { setError(null); setGeneratedBill(null); setShowBillModal(true); }}
            >
              <CheckCircle size={18} /> Generate Bill
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Billing;
