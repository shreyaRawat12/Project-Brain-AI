import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleCallback() {
      if (!isSupabaseConfigured || !supabase) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else {
          // If hash contains error
          const hash = window.location.hash;
          if (hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const desc = params.get('error_description') || 'Verification failed or link expired.';
            throw new Error(desc.replace(/\+/g, ' '));
          }
          // Normal exchange check
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'Verification link is invalid or has expired.');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg, #0B1015)', color: '#fff' }}>
      <div style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center', background: 'var(--surface, #121A22)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        {status === 'verifying' && (
          <>
            <Loader2 size={40} className="assistant-spin" style={{ color: 'var(--primary, #159D91)', margin: '0 auto 1rem' }} />
            <h3>Verifying your account...</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={44} style={{ color: 'var(--primary, #159D91)', margin: '0 auto 1rem' }} />
            <h3>Email Verified!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your account is now confirmed. Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={44} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
            <h3>Verification Failed</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{errorMessage}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login', { replace: true })}
              style={{ width: '100%' }}
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
