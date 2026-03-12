import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Loader2, RefreshCcw, Plus, X, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Products.css';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Spices', 'Grains', 'Snacks', 'Beverages'];
const UNIT_TYPES  = ['piece', 'weight', 'volume'];

// Packaging options vary per category
const CATEGORY_PACKAGING = {
  Vegetables: ['250g bag', '500g bag', '1kg bag', '2kg bag', 'Bunch', 'Piece'],
  Fruits:     ['250g', '500g', '1kg bag', '2kg bag', 'Piece', 'Dozen', '6-pack'],
  Dairy:      ['100ml pack', '200ml pack', '500ml pack', '1L pack', '200g pack', '400g pack', '500g tub'],
  Spices:     ['25g packet', '50g packet', '100g packet', '200g packet', '250g packet', '500g packet', '1kg packet'],
  Grains:     ['250g packet', '500g packet', '1kg packet', '2kg packet', '5kg bag', '10kg bag', '25kg bag'],
  Snacks:     ['Small pack', 'Medium pack', 'Large pack', '100g pack', '200g pack', 'Family pack'],
  Beverages:  ['200ml bottle', '500ml bottle', '1L bottle', '2L bottle', '200ml tetra', '1L tetra'],
};
const DEFAULT_PACKAGING = ['Loose', '100g pack', '250g pack', '500g pack', '1kg pack', '2kg pack'];

// Units for base price and stock context
const CATEGORY_UNITS = {
  Vegetables: 'kg',
  Fruits:     'kg',
  Dairy:      'Ltr',
  Spices:     'kg',
  Grains:     'kg',
  Snacks:     'pack',
  Beverages:  'Ltr'
};

const EMPTY_FORM = {
  name: '', price: '', stock: '', category: CATEGORIES[0],
  description: '', unitType: 'piece', packagingOptions: [],
};

const EMPTY_PKG  = { label: 'Loose', price: '', stock: '' };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);           // expanded packaging row

  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);           // null = add, id = edit
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [isSaving, setIsSaving]     = useState(false);

  const { activeShopId } = useShop();

  // Determine dynamic unit for the currently selected category
  const currentUnit = CATEGORY_UNITS[form.category] || 'unit';

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const getToken = () => localStorage.getItem('token');

  const fetchProducts = async () => {
    if (!activeShopId) return;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?shopId=${activeShopId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Failed to fetch products');
      setProducts(await res.json());
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, [activeShopId]);

  /* ── packaging helpers ── */
  const addPackaging = () => setForm(f => ({ ...f, packagingOptions: [...f.packagingOptions, { ...EMPTY_PKG }] }));
  const removePackaging = (i) => setForm(f => ({ ...f, packagingOptions: f.packagingOptions.filter((_, idx) => idx !== i) }));
  const updatePackaging = (i, field, val) =>
    setForm(f => ({
      ...f,
      packagingOptions: f.packagingOptions.map((p, idx) => idx === i ? { ...p, [field]: val } : p),
    }));

  /* ── modal open/close ── */
  const openAdd  = () => { setEditId(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const openEdit = (product) => {
    setEditId(product._id);
    setForm({
      name:             product.name,
      price:            product.price,
      stock:            product.stock,
      category:         product.category,
      description:      product.description || '',
      unitType:         product.unitType || 'piece',
      packagingOptions: product.packagingOptions || [],
    });
    setFormError('');
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(''); };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /* ── submit (add or edit) ── */
  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setIsSaving(true);
    try {
      const payload = {
        name:   form.name,
        price:  Number(form.price),
        stock:  Number(form.stock),
        category: form.category,
        description: form.description,
        unitType: form.unitType,
        shopId: activeShopId,
        packagingOptions: form.packagingOptions.map(p => ({
          ...p, quantity: Number(p.quantity), price: Number(p.price),
        })),
      };

      const url    = editId ? `${API_BASE_URL}/api/products/${editId}` : `${API_BASE_URL}/api/products`;
      const method = editId ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product');

      if (editId) {
        setProducts(prev => prev.map(p => p._id === editId ? data : p));
      } else {
        setProducts(prev => [...prev, data]);
      }
      closeModal();
    } catch (err) { setFormError(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}?shopId=${activeShopId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) { setError(err.message); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  /* ══════════ RENDER ══════════ */
  return (
    <div className="products-page panel-fadeIn">
      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card modal-card-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            {formError && <div className="error-message" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Row 1: Name + Category */}
              <div className="modal-form-row">
                <div className="modal-input-group">
                  <label>Product Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Jeera" required />
                </div>
                <div className="modal-input-group">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Price + Unit Type + Stock */}
              <div className="modal-form-row">
                <div className="modal-input-group">
                  <label>Base Price (₹) per {currentUnit} *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder={`e.g. 50 per ${currentUnit}`} required />
                </div>
                <div className="modal-input-group">
                  <label>Unit Type</label>
                  <select name="unitType" value={form.unitType} onChange={handleChange}>
                    {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>Base Stock (in {currentUnit}s) *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder={`e.g. 10 ${currentUnit}s`} required />
                </div>
              </div>

              {/* Description */}
              <div className="modal-input-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Optional description..." rows={2} />
              </div>

              {/* Packaging Options */}
              <div className="packaging-section">
                <div className="packaging-header">
                  <label>Packaging Options</label>
                  <button type="button" className="btn-add-pkg" onClick={addPackaging}>
                    <Plus size={14} /> Add Option
                  </button>
                </div>

                {form.packagingOptions.length === 0 && (
                  <p className="pkg-empty-hint">No packaging options. Click "Add Option" to define sizes like 1kg, 500g, etc.</p>
                )}

                {form.packagingOptions.map((pkg, i) => {
                  return (
                    <div key={i} className="packaging-row">
                      {pkg.isCustom ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            value={pkg.label}
                            onChange={e => updatePackaging(i, 'label', e.target.value)}
                            placeholder="Custom size..."
                            required
                            autoFocus
                            style={{ flex: 1 }}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              updatePackaging(i, 'isCustom', false);
                              updatePackaging(i, 'label', '');
                            }} 
                            style={{ padding: '0 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}
                            title="Back to list"
                          >
                            ✖
                          </button>
                        </div>
                      ) : (
                        <select
                          value={pkg.label}
                          onChange={e => {
                            if (e.target.value === '___CUSTOM___') {
                              updatePackaging(i, 'isCustom', true);
                              updatePackaging(i, 'label', '');
                            } else {
                              updatePackaging(i, 'label', e.target.value);
                            }
                          }}
                          required
                        >
                          <option value="" disabled>Select Size...</option>
                          {!['Loose', ...(CATEGORY_PACKAGING[form.category] || DEFAULT_PACKAGING)].includes(pkg.label) && pkg.label && pkg.label !== '___CUSTOM___' && (
                            <option value={pkg.label}>{pkg.label}</option>
                          )}
                          <option value="Loose">Loose</option>
                          {(CATEGORY_PACKAGING[form.category] || DEFAULT_PACKAGING).map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                          <option value="___CUSTOM___" style={{ fontWeight: 'bold' }}>+ Custom Option...</option>
                        </select>
                      )}
                      <input type="number" placeholder="₹ Price" min="0" step="0.01" value={pkg.price}
                        onChange={e => updatePackaging(i, 'price', e.target.value)} required />
                      <input type="number" placeholder="Stock (qty)" min="0" step="1" value={pkg.stock}
                        onChange={e => updatePackaging(i, 'stock', e.target.value)} required />
                      <button type="button" className="pkg-remove-btn" onClick={() => removePackaging(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 className="spinner" size={16} /> : <Plus size={16} />}
                  {isSaving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Table ── */}
      <div className="card full-height-card">
        <div className="products-header">
          <h2>Products</h2>
          <div className="products-actions">
            <button className="icon-btn-small" onClick={fetchProducts} disabled={isLoading}>
              <RefreshCcw size={16} className={isLoading ? 'spinner' : ''} />
            </button>
            <div className="search-box small-search">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search item..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="btn btn-primary add-product-btn" onClick={openAdd}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="table-responsive">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="spinner" size={32} color="#3b82f6" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              {products.length === 0
                ? (<><Package size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 1rem' }} /><p>No products yet. Click "Add Product" to get started!</p></>)
                : 'No products match your search.'}
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Type</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Packaging</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const isExpanded = expandedId === product._id;
                  const hasPkg = product.packagingOptions && product.packagingOptions.length > 0;
                  return (
                    <React.Fragment key={product._id}>
                      {/* ── Main product row ── */}
                      <tr
                        className={`product-row ${isExpanded ? 'product-row-expanded' : ''}`}
                        onClick={() => toggleExpand(product._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="font-medium">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`expand-chevron ${isExpanded ? 'open' : ''}`}>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                            {product.name}
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{product.category}</td>
                        <td>
                          <span className="unit-badge">{product.unitType || 'piece'}</span>
                        </td>
                        <td>₹ {product.price}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                            background: product.stock < 5 ? '#fef2f2' : product.stock < 10 ? '#fffbeb' : '#f0fdf4',
                            color:      product.stock < 5 ? '#ef4444' : product.stock < 10 ? '#d97706' : '#16a34a',
                          }}>
                            {product.stock} {CATEGORY_UNITS[product.category] || ''}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {hasPkg
                            ? <span className="pkg-count-badge">{product.packagingOptions.length} type{product.packagingOptions.length > 1 ? 's' : ''}</span>
                            : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* Stop propagation on action buttons so row click doesn't fire */}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button className="icon-btn-small edit" onClick={() => openEdit(product)}>
                              <Edit size={16} />
                            </button>
                            <button className="icon-btn-small delete" onClick={() => handleDelete(product._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded packaging detail row ── */}
                      {isExpanded && (
                        <tr className="packaging-detail-row">
                          <td colSpan={7}>
                            <div className="packaging-detail-panel">
                              <div className="pkg-detail-header">
                                <Package size={15} />
                                <span>Packaging Options for <strong>{product.name}</strong></span>
                              </div>

                              {hasPkg ? (
                                <table className="pkg-detail-table">
                                  <thead>
                                    <tr>
                                      <th>Label</th>
                                      <th>Price</th>
                                      <th>Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Base loose row */}
                                    <tr className="pkg-base-row">
                                      <td><span className="pkg-label-chip pkg-label-base">Loose (Base)</span></td>
                                      <td><strong>₹ {product.price}</strong></td>
                                      <td>
                                        <span style={{
                                          fontWeight: 600,
                                          color: product.stock < 5 ? '#ef4444' : product.stock < 10 ? '#d97706' : '#16a34a',
                                        }}>{product.stock}</span>
                                      </td>
                                    </tr>
                                    {product.packagingOptions.map((pkg, i) => (
                                      <tr key={i}>
                                        <td><span className="pkg-label-chip">{pkg.label}</span></td>
                                        <td><strong>₹ {pkg.price}</strong></td>
                                        <td>
                                          <span style={{
                                            fontWeight: 600,
                                            color: (pkg.stock || 0) < 5 ? '#ef4444' : (pkg.stock || 0) < 10 ? '#d97706' : '#16a34a',
                                          }}>{pkg.stock ?? '—'}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="pkg-none-msg">No packaging options defined. Click the edit button to add sizes like 1kg, 500g, etc.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
