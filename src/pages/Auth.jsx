import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';

export default function Auth({ mode = 'login' }) {
  const { login, signup, session } = useStore();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/admin' : from || '/account', { replace: true });
  }, [session, navigate, from]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const err = await (isLogin ? login(form) : signup(form));
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-wrap">
      <motion.div
        key={mode}
        className="card auth-card"
        initial={{ rotateY: isLogin ? -90 : 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">{isLogin ? 'Sign in to see your saved homes, inquiries and history.' : 'Keep saved homes, inquiries, calculations and your history in one place.'}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          {!isLogin && <div className="field"><label htmlFor="a-name">Full name</label><input id="a-name" className="input" required value={form.name} onChange={set('name')} /></div>}
          <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" className="input" type="email" required value={form.email} onChange={set('email')} /></div>
          <div className="field"><label htmlFor="a-pw">Password</label><input id="a-pw" className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', marginBottom: 0 }}>
          {isLogin ? <>New here? <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create an account</Link></>
            : <>Already have an account? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign in</Link></>}
        </p>
      </motion.div>
    </div>
  );
}
