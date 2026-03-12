import { API_BASE_URL } from '../config';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShoppingCart, ArrowRight, Loader2, Copy, Check, KeyRound } from 'lucide-react';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Something went wrong');
            setResetToken(data.resetToken);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToken = () => {
        navigator.clipboard.writeText(resetToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo">
                        <ShoppingCart className="logo-icon" />
                        <h2>SmartCart</h2>
                    </div>
                    <h1 className="auth-title">Forgot Password</h1>
                    <p className="subtitle">Enter your email to receive a reset token.</p>
                </div>

                {!resetToken ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label htmlFor="fp-email">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" />
                                <input
                                    type="email"
                                    id="fp-email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="spinner" />
                            ) : (
                                <>
                                    Send Reset Token
                                    <ArrowRight className="btn-icon" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="token-display">
                        <div className="token-icon-wrap">
                            <KeyRound className="token-icon" />
                        </div>
                        <p className="token-label">Your Password Reset Token</p>
                        <p className="token-hint">Copy this token and use it on the reset page. It expires in 30 minutes.</p>
                        <div className="token-box">
                            <span className="token-value">{resetToken}</span>
                            <button className="copy-btn" onClick={copyToken} title="Copy token">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <Link to={`/reset-password/${resetToken}`} className="submit-btn reset-link-btn">
                            Go to Reset Password
                            <ArrowRight className="btn-icon" />
                        </Link>
                    </div>
                )}

                <div className="toggle-mode">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login" className="toggle-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
