import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

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
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{ fontSize: '3rem', marginBottom: '16px' }}
            >
              📧
            </motion.div>
            <h2 style={{ marginBottom: '12px' }}>¡Email enviado!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/login" className="btn btn-secondary">
              <ArrowLeft size={16} /> Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <Globe size={32} className="auth-logo-icon" />
              <h1 className="auth-title display">Recuperar</h1>
              <p className="auth-subtitle">Ingresá tu email para recibir un enlace de recuperación</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', zIndex: 1 }} />
                  <input
                    id="email"
                    type="email"
                    className={`input ${error ? 'error' : ''}`}
                    style={{ paddingLeft: '40px' }}
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="error-text auth-error" role="alert">{error}</p>}

              <motion.button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="spinner-sm" /> : null}
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </motion.button>
            </form>

            <p className="auth-switch">
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
