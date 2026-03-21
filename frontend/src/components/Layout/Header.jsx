import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ListOrdered, User, LogOut, Globe, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Use Google displayName, fall back to email prefix
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="header">
      <div className="header-inner page-container">
        <Link to="/" className="header-logo">
          <Globe size={22} className="logo-icon" />
          <span className="logo-text display">FixtureMundial</span>
          <span className="logo-year">2026</span>
        </Link>

        <nav className="header-nav" aria-label="Navegación principal">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <Trophy size={16} /><span>Fixture</span>
          </NavLink>
          <NavLink to="/ranking" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ListOrdered size={16} /><span>Ranking</span>
          </NavLink>
          <NavLink to="/simulacion" className={({ isActive }) => `nav-link nav-link--sim ${isActive ? 'active' : ''}`}>
            <FlaskConical size={16} /><span>Simulación</span>
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={16} /><span>Perfil</span>
          </NavLink>
        </nav>

        <div className="header-user">
          {user && (
            <>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="user-avatar user-avatar--photo"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar" aria-label={`Usuario: ${displayName}`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="user-name">{displayName}</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="logout-label">Salir</span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
