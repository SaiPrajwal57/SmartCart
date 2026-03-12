import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ReceiptText, Package, TrendingUp, Users, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <ReceiptText size={32} />, title: 'Smart Billing',
    desc: 'Generate lightning-fast bills, track payment methods, and keep complete billing history with zero hassle.'
  },
  {
    icon: <Package size={32} />, title: 'Inventory Control',
    desc: 'Manage your full product catalogue with packaging variants, stock alerts, and categories built in.'
  },
  {
    icon: <TrendingUp size={32} />, title: 'Deep Analytics',
    desc: 'Visualize sales trends, top-selling items, and revenue growth with beautiful real-time charts.'
  },
  {
    icon: <Users size={32} />, title: 'Team Management',
    desc: 'Add staff accounts for each shop, assign them roles, and keep each team member focused on their work.'
  },
  {
    icon: <ShoppingCart size={32} />, title: 'Multi-Shop Support',
    desc: 'Manage multiple shops from one account. Seamlessly switch between storefronts in seconds.'
  },
  {
    icon: <ShieldCheck size={32} />, title: 'Secure & Reliable',
    desc: 'JWT-based authentication, role-based access control, and data isolation per shop keep your data safe.'
  },
];

const steps = [
  { num: '01', title: 'Register your account', desc: 'Sign up as a shop owner in under a minute.' },
  { num: '02', title: 'Create your shop', desc: 'Add your shop details — name, address, and contact.' },
  { num: '03', title: 'Add your products', desc: 'Build your product catalogue with categories & packaging.' },
  { num: '04', title: 'Start billing', desc: 'Generate bills and watch your analytics grow in real time.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!heroRef.current) return;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width - 0.5) * 20;
      const y = ((e.clientY - top) / height - 0.5) * -20;
      heroRef.current.style.setProperty('--rx', `${y}deg`);
      heroRef.current.style.setProperty('--ry', `${x}deg`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav className="land-nav">
        <div className="land-logo">
          <ShoppingCart size={26} className="land-logo-icon" />
          <span>SmartCart</span>
        </div>
        <div className="land-nav-actions">
          <button className="land-btn-ghost" onClick={() => navigate('/login')}>Log In</button>
          <button className="land-btn-primary" onClick={() => navigate('/login')}>Get Started <ArrowRight size={16} /></button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="land-hero" ref={heroRef}>
        <div className="hero-blob blob-1" />
        <div className="hero-blob blob-2" />
        <div className="land-hero-inner">
          <div className="hero-badge"><Star size={14} /> Smart Retail, Simplified</div>
          <h1 className="land-headline">
            Run Your Shop <br />
            <span className="land-gradient-text">Like a Pro</span>
          </h1>
          <p className="land-sub">
            SmartCart is the all-in-one retail management platform for shop owners — billing, inventory, analytics, and staff management in one beautiful dashboard.
          </p>
          <div className="hero-cta-row">
            <button className="land-btn-primary large" onClick={() => navigate('/login')}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button className="land-btn-neumorphic" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="land-section land-features">
        <div className="land-section-label">Everything you need</div>
        <h2 className="land-section-title">Packed with powerful features</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-section land-steps">
        <div className="land-section-label">Simple setup</div>
        <h2 className="land-section-title">Up and running in minutes</h2>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="land-cta-banner">
        <h2>Ready to take control of your shop?</h2>
        <p>Join thousands of shop owners already using SmartCart to run their business smarter.</p>
        <button className="land-btn-primary large" onClick={() => navigate('/login')}>
          Create Free Account <ArrowRight size={18} />
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <div className="land-logo" style={{ opacity: 0.7 }}>
          <ShoppingCart size={22} className="land-logo-icon" />
          <span>SmartCart</span>
        </div>
        <p>© {new Date().getFullYear()} SmartCart. Built for retail, designed to delight.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
