import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ShoppingCart, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import './ForgotPassword.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [resetToken, setResetToken] = useState(token || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/auth/reset-password/${resetToken}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Something went wrong');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo">
                        <ShoppingCart className="logo-icon" />
                        <h2>SmartCart</h2>
                    </div>
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="subtitle">Enter your reset token and choose a new password.</p>
                </div>

                {success ? (
                    <div className="success-display">
                        <CheckCircle className="success-icon" />
                        <p className="success-title">Password Reset Successful!</p>
                        <p className="success-hint">Redirecting you to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}

                        {!token && (
                            <div className="input-group">
                                <label htmlFor="rp-token">Reset Token</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type="text"
                                        id="rp-token"
                                        placeholder="Paste your reset token"
                                        value={resetToken}
                                        onChange={(e) => setResetToken(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="rp-password">New Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    type="password"
                                    id="rp-password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="rp-confirm">Confirm New Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    type="password"
                                    id="rp-confirm"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="spinner" />
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight className="btn-icon" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="toggle-mode">
                    <p>
                        <Link to="/forgot-password" className="toggle-link">← Back to forgot password</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
