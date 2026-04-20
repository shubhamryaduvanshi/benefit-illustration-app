import React, { useState } from 'react';
import { apiFetch } from '../lib/api';

type Mode = 'login' | 'register';

export function AuthPage({
  onAuthed,
}: {
  onAuthed: (data: { token: string; user: { id: string; email: string; mobileMasked?: string | null; dobMasked?: string | null } }) => void;
}) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Password@123');
  const [mobile, setMobile] = useState('9999999999');
  const [dob, setDob] = useState('1995-01-01');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : {
            email,
            password,
            mobile,
            dob,
          };

      const { resp, payload } = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      if (!resp.ok) {
        setErrors([payload?.error || 'Request failed']);
        return;
      }
      if (!payload?.token) {
        setErrors(['Missing token in response']);
        return;
      }
      onAuthed(payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="card">
        <div className="cardBody" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div className="sectionTitle">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
              <div className="sectionHint">JWT-based auth. Mobile/DOB are stored masked.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={mode === 'login' ? 'btn btnPrimary' : 'btn'}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={mode === 'register' ? 'btn btnPrimary' : 'btn'}
          >
            Register
          </button>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <div className="grid2">
              <div className="field">
                <div className="label">Email</div>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <div className="label">Password</div>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid2">
                <div className="field">
                  <div className="label">Mobile (masked in DB)</div>
                  <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
                <div className="field">
                  <div className="label">DOB (masked in DB)</div>
                  <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="alert">
                <div className="alertTitle">Could not {mode === 'login' ? 'login' : 'register'}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)' }}>
                  {errors.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btnPrimary">
              {mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

