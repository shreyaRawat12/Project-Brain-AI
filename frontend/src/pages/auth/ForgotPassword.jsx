import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import './Login.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
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
          <h1 className="auth-left-heading">Account Recovery</h1>
          <p className="auth-left-sub">Enter your email address to receive instructions to reset your password.</p>
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
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--muted, #94a3b8)',
              cursor: 'pointer',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>

          <h2 className="auth-title">Reset Your Password</h2>
          <p className="auth-subtitle">We'll email you a secure link to create a new password.</p>

          {sent ? (
            <div className="verification-notice" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <CheckCircle size={44} style={{ color: 'var(--primary, #159D91)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Check Your Email</h3>
              <p style={{ color: 'var(--muted, #94a3b8)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been delivered to your inbox.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <Mail size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading || !email.trim()}>
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
