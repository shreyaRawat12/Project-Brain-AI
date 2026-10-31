import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const reduce = useReducedMotion();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">PB</div>
          <div>
            <div className="auth-brand-title">PROJECT BRAIN</div>
            <div className="auth-brand-sub">DELIVERY MEMORY SYSTEM</div>
          </div>
        </div>
        <div className="auth-left-content">
          <h1 className="auth-left-heading">Set New Password</h1>
          <p className="auth-left-sub">Choose a strong, secure password to regain access to your account.</p>
          <div className="auth-tech-blitz">TECH × BLITZ</div>
        </div>
        <div className="auth-left-glow" />
      </div>

      <div className="auth-right">
        <motion.div
          className="auth-card"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Enter your new account password below.</p>

          {success ? (
            <div className="verification-notice" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <CheckCircle size={44} style={{ color: 'var(--primary, #159D91)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Password Updated!</h3>
              <p style={{ color: 'var(--muted, #94a3b8)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/login', { replace: true })}
                style={{ width: '100%' }}
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrap">
                  <Lock size={14} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrap">
                  <Lock size={14} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
