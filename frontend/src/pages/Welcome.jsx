import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="welcome-container">
      <div className="welcome-card panel-fadeIn">
        <div className="welcome-icon-wrapper">
          <Sparkles className="welcome-icon primary-icon" size={40} />
          <Store className="welcome-icon secondary-icon" size={32} />
        </div>
        
        <h1 className="welcome-title">Welcome to SmartCart, {user?.name || 'Partner'}!</h1>
        <p className="welcome-subtitle">
          We're thrilled to have you on board. Your journey to smarter retail management starts here.
        </p>
        
        <div className="welcome-steps">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-text">Create your shop profile</div>
          </div>
          <div className="step-item muted">
            <div className="step-number">2</div>
            <div className="step-text">Add your products</div>
          </div>
          <div className="step-item muted">
            <div className="step-number">3</div>
            <div className="step-text">Start billing your customers</div>
          </div>
        </div>

        <button 
          className="welcome-btn" 
          onClick={() => navigate('/app/create-shop')}
        >
          <span>Get Started — Add Your Shop</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Welcome;
