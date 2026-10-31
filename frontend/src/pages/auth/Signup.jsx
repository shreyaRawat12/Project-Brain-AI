import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import './Login.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const reduce = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  if (user) {
    navigate('/dashboard', { replace: true });
  }

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRequiresVerification(false);

    if (!form.name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(form.name, form.email, form.password);
      if (res?.requiresVerification) {
        setRequiresVerification(true);
        setSuccess('Check your email to verify your account before signing in.');
      } else {
        setSuccess('Account created successfully.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            <h1 className="auth-left-heading">Preserve Knowledge. Accelerate Intelligence.</h1>
            <p className="auth-left-sub">Your team's engineering knowledge, connected, organized, and always accessible.</p>
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
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">Start building your team's institutional memory.</p>

            {requiresVerification ? (
              <div className="verification-notice" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <CheckCircle size={44} style={{ color: 'var(--primary, #159D91)', margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>Check Your Email</h3>
                <p style={{ color: 'var(--muted, #94a3b8)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  We sent a confirmation link to <strong>{form.email}</strong>. Please click the link in your email to verify your account and sign in.
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
                  <label className="form-label">Full Name</label>
                  <div className="input-wrap">
                    <User size={14} />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Maya Patel"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <Mail size={14} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <Lock size={14} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrap">
                    <Lock size={14} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                  {loading ? 'Please wait...' : 'Create Account'}
                </button>
              </form>
            )}

            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
