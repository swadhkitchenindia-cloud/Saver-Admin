import React, { useState } from 'react';
import { useAdminAuth } from '../components/AdminAuth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      if (!ok) setErr('Invalid credentials. Please try again.');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="admin-login">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🍊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Saver Admin</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Platform management dashboard</div>
        </div>

        <form onSubmit={submit}>
          {err && <div className="alert alert-error">{err}</div>}
          <div className="field">
            <label>Admin email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@saver.in" required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          🔒 Restricted access — Saver team only
        </div>
      </div>
    </div>
  );
}
