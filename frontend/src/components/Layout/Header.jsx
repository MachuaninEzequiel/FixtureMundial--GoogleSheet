import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ListOrdered, User, LogOut, Globe, FlaskConical, Menu, X, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Use Google displayName, fall back to email prefix
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="header">
      <div className="header-inner page-container">
        
        {/* Hamburger Button (Mobile Only) */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="header-logo" onClick={closeMenu}>
          <Globe size={22} className="logo-icon" />
          <span className="logo-text display">FixtureMundial</span>
          <span className="logo-year">2026</span>
        </Link>

        {/* Navigation Wrapper */}
        <div className={`header-nav-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
          <nav className="header-nav" aria-label="Navegación principal">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end onClick={closeMenu}>
              <Trophy size={16} /><span>Fixture</span>
            </NavLink>
            <NavLink to="/ranking" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <ListOrdered size={16} /><span>Ranking</span>
            </NavLink>
            <NavLink to="/simulacion" className={({ isActive }) => `nav-link nav-link--sim ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <FlaskConical size={16} /><span>Simulación</span>
            </NavLink>
            <NavLink to="/torneo-privado" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <Users size={16} /><span>Ligas Privadas</span>
            </NavLink>
            <NavLink to="/perfil" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <User size={16} /><span>Perfil</span>
            </NavLink>
          </nav>

          <div className="header-user">
            {user && (
              <>
                <div className="user-avatar-wrap">
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
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm btn-logout"
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

        {/* Overlay backdrop for mobile */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-backdrop" onClick={closeMenu} />
        )}

      </div>
    </header>
  );
}
