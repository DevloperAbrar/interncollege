import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Linkedin, Github } from 'lucide-react';

const SharedFooter = () => {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    // If not on home page, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="sf-footer">
        <div className="sf-inner">
          {/* Brand col */}
          <div className="sf-brand-col">
            <div className="sf-brand">
              <div className="sf-brand-icon">
                <GraduationCap size={18} color="#fff" />
              </div>
              <span className="sf-brand-name">InternTrack</span>
            </div>
            <p className="sf-desc">
              Official internship &amp; project management platform for<br />
              Madhav Institute of Technology &amp; Science — DU Gwalior.
            </p>
            <div className="sf-socials">
              <a href="mailto:moabrarqureshi786@gmail.com" className="sf-social"><Mail size={15} /></a>
              <a href="https://linkedin.com/in/moabrarqureshi" target="_blank" rel="noreferrer" className="sf-social"><Linkedin size={15} /></a>
              <a href="https://github.com/moabrarqureshi" target="_blank" rel="noreferrer" className="sf-social"><Github size={15} /></a>
            </div>
          </div>

          {/* Links */}
          <div className="sf-links-group">
            <div className="sf-col">
              <h4 className="sf-col-title">Platform</h4>
              {[
                { label: 'Home',         action: () => navigate('/') },
                { label: 'Features',     action: () => scrollTo('features') },
                { label: 'How It Works', action: () => scrollTo('how-it-works') },
                { label: 'Testimonials', action: () => scrollTo('testimonials') },
              ].map(({ label, action }) => (
                <button key={label} className="sf-link" onClick={action}>{label}</button>
              ))}
            </div>
            <div className="sf-col">
              <h4 className="sf-col-title">Pages</h4>
              <button className="sf-link" onClick={() => navigate('/analytics')}>Analytics</button>
              <button className="sf-link" onClick={() => navigate('/developer')}>Developer</button>
              <button className="sf-link" onClick={() => navigate('/features')}>Features</button>
              <button className="sf-link" onClick={() => navigate('/about')}>About</button>
            </div>
            <div className="sf-col">
              <h4 className="sf-col-title">Access</h4>
              <button className="sf-link" onClick={() => navigate('/login')}>Student Login</button>
              <button className="sf-link" onClick={() => navigate('/login')}>Mentor Login</button>
              <button className="sf-link" onClick={() => navigate('/login')}>Admin Login</button>
            </div>
          </div>
        </div>

        <div className="sf-bottom">
          <span>© 2025 InternTrack — MITS Gwalior. All rights reserved.</span>
          <span>Developed with ❤️ by Mo Abrar Qureshi</span>
        </div>
      </footer>

      <style>{`
        .sf-footer {
          background: #09090B;
          padding: 60px 24px 0;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .sf-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid #27272A;
        }
        @media(max-width: 768px) { .sf-inner { grid-template-columns: 1fr; gap: 32px; } }
        .sf-brand {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .sf-brand-icon {
          width: 30px; height: 30px; background: #4F46E5;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sf-brand-name { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -.3px; }
        .sf-desc { font-size: 13.5px; color: #71717A; line-height: 1.7; margin: 0 0 20px; max-width: 320px; }
        .sf-socials { display: flex; gap: 10px; }
        .sf-social {
          width: 34px; height: 34px; border-radius: 8px;
          background: #18181B; border: 1px solid #27272A;
          color: #71717A; display: flex; align-items: center; justify-content: center;
          transition: background .15s, color .15s; text-decoration: none;
        }
        .sf-social:hover { background: #27272A; color: #fff; }
        .sf-links-group {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        @media(max-width: 480px) { .sf-links-group { grid-template-columns: 1fr 1fr; } }
        .sf-col { display: flex; flex-direction: column; gap: 10px; }
        .sf-col-title {
          font-size: 11.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .08em; color: #52525B; margin-bottom: 4px;
        }
        .sf-link {
          background: none; border: none; padding: 0;
          font-size: 13.5px; color: #71717A; cursor: pointer;
          text-align: left; transition: color .15s;
          font-family: -apple-system, 'Segoe UI', sans-serif;
        }
        .sf-link:hover { color: #A1A1AA; }
        .sf-bottom {
          max-width: 1200px; margin: 0 auto;
          padding: 20px 0;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 8px;
          font-size: 12.5px; color: #52525B;
        }
      `}</style>
    </>
  );
};

export default SharedFooter;