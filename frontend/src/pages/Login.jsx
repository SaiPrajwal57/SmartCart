import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ShoppingCart, ArrowRight, Loader2, KeyRound, Check, X } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength rules
    const passwordRules = useMemo(() => [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
        { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
        { label: 'One digit',             test: (p) => /[0-9]/.test(p) },
        { label: 'One special character',  test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
    ], []);

    const passedCount = passwordRules.filter(r => r.test(password)).length;
    const isPasswordStrong = passedCount === passwordRules.length;
    const strengthPercent = (passedCount / passwordRules.length) * 100;
    const strengthColor = strengthPercent <= 40 ? '#ef4444' : strengthPercent <= 80 ? '#f59e0b' : '#22c55e';
    const strengthLabel = strengthPercent <= 40 ? 'Weak' : strengthPercent <= 80 ? 'Fair' : 'Strong';
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Block registration if password is weak
        if (!isLogin && !isPasswordStrong) {
            setError('Please create a strong password that meets all requirements.');
            return;
        }

        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin
            ? { email, password }
            : { name, email, password, ...(adminKey ? { adminKey } : {}) };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            // Use AuthContext to save user & token
            const { token, ...userData } = data;
            login(userData, token);

            // Redirect based on role
            if (userData.role === 'staff') {
                navigate('/app/billing', { replace: true });
            } else if (userData.role === 'owner') {
                if (isLogin) {
                    navigate('/app/shop-selector', { replace: true });
                } else {
                    navigate('/app/welcome', { replace: true });
                }
            } else if (userData.role === 'admin') {
                navigate('/app/admin', { replace: true });
            } else {
                navigate('/app', { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo">
                        <ShoppingCart className="logo-icon" />
                        <h2>SmartCart</h2>
                    </div>
                    <p className="subtitle">
                        {isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to get started.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}
                    
                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="adminKey">Admin Key <span style={{color:'#a0aec0', fontWeight: 400, fontSize: '0.8rem'}}>(optional)</span></label>
                            <div className="input-wrapper">
                                <KeyRound className="input-icon" />
                                <input
                                    type="password"
                                    id="adminKey"
                                    placeholder="Enter admin secret key"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password strength indicator – only during registration */}
                        {!isLogin && password.length > 0 && (
                            <div className="password-strength">
                                <div className="strength-bar-track">
                                    <div
                                        className="strength-bar-fill"
                                        style={{ width: `${strengthPercent}%`, background: strengthColor }}
                                    />
                                </div>
                                <span className="strength-label" style={{ color: strengthColor }}>
                                    {strengthLabel}
                                </span>
                                <ul className="strength-rules">
                                    {passwordRules.map((rule, i) => {
                                        const passed = rule.test(password);
                                        return (
                                            <li key={i} className={passed ? 'rule-pass' : 'rule-fail'}>
                                                {passed
                                                    ? <Check className="rule-icon pass" />
                                                    : <X className="rule-icon fail" />}
                                                {rule.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {isLogin && (
                        <div className="forgot-password">
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="spinner" />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Sign Up'}
                                <ArrowRight className="btn-icon" />
                            </>
                        )}
                    </button>
                </form>

                <div className="toggle-mode">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="toggle-btn"
                        >
                            {isLogin ? 'Register as Owner/Admin' : 'Log in instead'}
                        </button>
                    </p>
                </div>

                {!isLogin && (
                    <div className="registration-hint">
                        <strong>Note:</strong> Shop Staff cannot register themselves. Shop Owners must create staff accounts.
                    </div>
                )}
                {isLogin && (
                    <div className="registration-hint" style={{ boxShadow: 'none', background: 'transparent' }}>
                        Your role is automatically detected when you log in.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
