import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sun, Moon, Menu, X, GraduationCap, BarChart3, ChevronRight
} from 'lucide-react';

const SharedNavbar = ({ onNavigateToLogin, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isHome = location.pathname === '/';

  const scrollTo = (id) => {
    if (!isHome) {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home',         action: () => navigate('/') },
    { label: 'Features',     action: () => scrollTo('features') },
    { label: 'How It Works', action: () => scrollTo('how-it-works') },
    { label: 'Testimonials', action: () => scrollTo('testimonials') },
  ];

  return (
    <>
      <nav className={`snav ${isScrolled ? 'snav-scrolled' : ''} ${darkMode ? 'dark' : ''}`}>
        <div className="snav-inner">
          {/* Brand */}
          <button className="snav-brand" onClick={() => navigate('/')}>
            <div className="snav-brand-icon">
              <GraduationCap size={18} color="#fff" />
            </div>
            <span className="snav-brand-name">InternTrack</span>
          </button>

          {/* Desktop links */}
          <div className="snav-links desktop-only">
            {navLinks.map(({ label, action }) => (
              <button key={label} className="snav-link" onClick={action}>{label}</button>
            ))}
            <button
              className={`snav-link ${location.pathname === '/analytics' ? 'snav-link-active' : ''}`}
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Analytics
            </button>
            <button
              className={`snav-link ${location.pathname === '/developer' ? 'snav-link-active' : ''}`}
              onClick={() => navigate('/developer')}
            >
              Developer
            </button>
          </div>

          {/* Actions */}
          <div className="snav-actions">
            <button className="snav-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {onNavigateToLogin && (
              <button className="snav-btn-login" onClick={onNavigateToLogin}>
                Login <ChevronRight size={14} />
              </button>
            )}
            <button className="snav-icon-btn mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className={`snav-mobile ${darkMode ? 'dark' : ''}`}>
            {navLinks.map(({ label, action }) => (
              <button key={label} className="snav-mobile-link" onClick={action}>{label}</button>
            ))}
            <button className="snav-mobile-link" onClick={() => { navigate('/analytics'); setIsMenuOpen(false); }}>Analytics</button>
            <button className="snav-mobile-link" onClick={() => { navigate('/developer'); setIsMenuOpen(false); }}>Developer</button>
            {onNavigateToLogin && (
              <button className="snav-mobile-link snav-mobile-accent" onClick={onNavigateToLogin}>Login →</button>
            )}
          </div>
        )}
      </nav>

      <style>{`
        .snav {
          position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid transparent;
          transition: background .3s, box-shadow .3s, border-color .3s;
          --c-bg: #FAFAFA; --c-surface: #fff; --c-surface2: #F4F4F5;
          --c-border: #E4E4E7; --c-text: #09090B; --c-text2: #52525B;
          --c-primary: #4F46E5; --c-primary-dark: #3730A3;
          background: var(--c-bg);
        }
        .snav.dark {
          --c-bg: #09090B; --c-surface: #18181B; --c-surface2: #27272A;
          --c-border: #3F3F46; --c-text: #FAFAFA; --c-text2: #A1A1AA;
          background: var(--c-bg);
        }
        .snav-scrolled {
          background: var(--c-surface) !important;
          border-bottom-color: var(--c-border) !important;
          box-shadow: 0 1px 16px rgba(0,0,0,.07);
        }
        .snav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          height: 64px; display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
        }
        .snav-brand {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer; text-decoration: none;
          flex-shrink: 0;
        }
        .snav-brand-icon {
          width: 30px; height: 30px; background: var(--c-primary);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .snav-brand-name {
          font-size: 16px; font-weight: 700; color: var(--c-text); letter-spacing: -.3px;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .snav-links { display: flex; align-items: center; gap: 2px; }
        .snav-link {
          background: none; border: none; padding: 7px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500; color: var(--c-text2); cursor: pointer;
          transition: background .15s, color .15s; white-space: nowrap;
          display: flex; align-items: center;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .snav-link:hover { background: var(--c-surface2); color: var(--c-text); }
        .snav-link-active { color: var(--c-primary) !important; background: #EEF2FF; }
        .snav.dark .snav-link-active { background: #1E1B4B; }
        .snav-actions { display: flex; align-items: center; gap: 8px; }
        .snav-icon-btn {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid var(--c-border); background: var(--c-surface);
          color: var(--c-text2); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s, color .15s;
        }
        .snav-icon-btn:hover { background: var(--c-surface2); color: var(--c-text); }
        .snav-btn-login {
          display: flex; align-items: center; gap: 4px;
          padding: 8px 16px; border-radius: 8px;
          background: var(--c-primary); color: #fff; border: none;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          transition: background .15s, transform .1s;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .snav-btn-login:hover { background: var(--c-primary-dark); transform: translateY(-1px); }
        .desktop-only { display: flex; }
        .mobile-only  { display: none; }
        @media(max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only  { display: flex; }
        }
        .snav-mobile {
          background: var(--c-surface); border-top: 1px solid var(--c-border);
          padding: 12px 24px 18px; display: flex; flex-direction: column; gap: 2px;
        }
        .snav-mobile-link {
          background: none; border: none; padding: 10px 12px; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: var(--c-text2); cursor: pointer;
          text-align: left; transition: background .15s, color .15s;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .snav-mobile-link:hover { background: var(--c-surface2); color: var(--c-text); }
        .snav-mobile-accent { color: var(--c-primary) !important; font-weight: 600; margin-top: 6px; }
      `}</style>
    </>
  );
};

export default SharedNavbar;