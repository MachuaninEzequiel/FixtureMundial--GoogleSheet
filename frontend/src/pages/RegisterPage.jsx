import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Eye, EyeOff, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();

  const validate = () => {
    const errs = {};
    if (!username.trim() || username.length < 3) errs.username = 'Mínimo 3 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inválido';
    if (password.length < 6) errs.password = 'Mínimo 6 caracteres';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(username.trim(), email, password);
      // Backend returns { pending: true } — show waiting screen
      setRegistered(true);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Error al registrarse' });
    } finally {
      setLoading(false);
    }
  };

  // Pending approval screen after registration
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-bg" aria-hidden="true">
          <div className="auth-orb auth-orb-1" /><div className="auth-orb auth-orb-2" />
        </div>
        <motion.div className="auth-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ display: 'inline-block', marginBottom: 20 }}
            >
              <Clock size={64} color="var(--color-gold)" />
            </motion.div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>🎉 ¡Registro exitoso!</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>
              Bienvenido/a <strong style={{ color: 'var(--color-text)' }}>{username}</strong>.<br />
              Tu cuenta está <strong style={{ color: 'var(--color-gold)' }}>pendiente de aprobación</strong><br />
              por el administrador antes de poder ingresar.
            </p>
            <div style={{ padding: '14px 16px', background: 'var(--color-gold-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,197,24,0.25)', fontSize: '0.85rem', color: 'var(--color-gold)', marginBottom: 24 }}>
              ⏳ Pronto recibirás acceso. ¡Ya casi!
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              Ir al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-header">
          <Globe size={32} className="auth-logo-icon" />
          <h1 className="auth-title display">FixtureMundial</h1>
          <p className="auth-subtitle">Creá tu cuenta y empezá a pronosticar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <label htmlFor="username" className="input-label">Nombre de usuario</label>
            <input
              id="username"
              type="text"
              className={`input ${errors.username ? 'error' : ''}`}
              placeholder="ej: el_pibe_10"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'error' : ''}`}
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Contraseña</label>
            <div className="input-password-wrap">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className={`input ${errors.password ? 'error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {errors.general && <p className="error-text auth-error" role="alert">{errors.general}</p>}

          <motion.button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="spinner-sm" /> : null}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </motion.button>
        </form>

        <p className="auth-switch">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login">Iniciá sesión</Link>
        </p>
      </motion.div>
    </div>
  );
}
