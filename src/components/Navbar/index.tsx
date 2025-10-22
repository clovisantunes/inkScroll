import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.scss';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.logo}>
          <Link to="/" onClick={closeMenu} className={styles.logoLink}>
            <span className={styles.logoText}>InkScroll</span>
            <div className={styles.tagline}>Read with style 🖋️</div>
          </Link>
        </div>

        <div className={styles.navMenu}>
          <Link to="/" className={styles.navLink} onClick={closeMenu}>
            Início
          </Link>
          <Link to="/categorias" className={styles.navLink} onClick={closeMenu}>
            Categorias
          </Link>
          <Link to="/doacoes" className={styles.navLink} onClick={closeMenu}>
            Doações
          </Link>
        </div>

        <div className={styles.authButtons}>
          <Link to="/login" className={styles.loginBtn}>
            Entrar
          </Link>
          <Link to="/register" className={styles.registerBtn}>
            Criar Conta
          </Link>
        </div>

        <div className={styles.mobileMenu}>
          <button 
            className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileNav}>
          <Link to="/" className={styles.mobileNavLink} onClick={closeMenu}>
            Início
          </Link>
          <Link to="/categorias" className={styles.mobileNavLink} onClick={closeMenu}>
            Categorias
          </Link>
          <Link to="/doacoes" className={styles.mobileNavLink} onClick={closeMenu}>
            Doações
          </Link>
          <div className={styles.mobileAuth}>
            <Link to="/login" className={styles.mobileLoginBtn} onClick={closeMenu}>
              Entrar
            </Link>
            <Link to="/register" className={styles.mobileRegisterBtn} onClick={closeMenu}>
              Criar Conta
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
 
export default Navbar;