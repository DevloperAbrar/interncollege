import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, GraduationCap, MapPin, Globe, Award, Users, BookOpen, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('theme'); if (s) setDarkMode(s === 'dark');
  }, []);
  useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const milestones = [
    { year: '2023', title: 'Project Initiated', desc: 'Identified the need for a centralized internship management system at MITS Gwalior.' },
    { year: '2024', title: 'Development Started', desc: 'Mo Abrar Qureshi began development under the guidance of Dr. Dhananjay Bisen.' },
    { year: '2024', title: 'Beta Launch', desc: 'First version deployed for testing with selected students and mentors.' },
    { year: '2025', title: 'Full Rollout', desc: 'Platform launched for all departments. 500+ students onboarded successfully.' },
  ];

  const values = [
    { icon: BookOpen, title: 'Transparency', desc: 'Every student can track their submission status in real time. No more uncertainty.' },
    { icon: Users, title: 'Collaboration', desc: 'Students, mentors, and admins work together seamlessly on one platform.' },
    { icon: Award, title: 'Excellence', desc: 'Built to meet university standards while being simple enough for everyone to use.' },
    { icon: Globe, title: 'Accessibility', desc: 'Responsive design works on all devices — desktop, tablet, and mobile.' },
  ];

  return (
    <div className={`about-root ${darkMode ? 'dark' : ''}`}>
      <nav className="about-nav">
        <div className="about-nav-inner">
          <button className="about-back" onClick={() => navigate('/')}>
            <ArrowLeft size={15}/> Back
          </button>
          <div className="about-brand">
            <div className="about-brand-icon"><GraduationCap size={16} color="#fff"/></div>
            <span>InternTrack</span>
          </div>
          <button className="about-theme" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
        </div>
      </nav>

      <section className="about-hero">
        <div className="about-hero-inner">
          <span className="about-tag" data-animate>About</span>
          <h1 className="about-h1" data-animate>
            About <span className="about-accent">InternTrack</span>
          </h1>
          <p className="about-hero-sub" data-animate>
            A purpose-built platform for managing internships and academic projects at
            Madhav Institute of Technology &amp; Science — DU Gwalior.
          </p>
        </div>
      </section>

      {/* College info */}
      <section className="about-section">
        <div className="about-inner">
          <div className="about-college-card" data-animate>
            <div className="about-college-info">
              <div className="about-college-badge">
                <GraduationCap size={14}/> Government Autonomous University
              </div>
              <h2 className="about-college-name">Madhav Institute of Technology &amp; Science</h2>
              <p className="about-college-sub">DU Gwalior — Madhya Pradesh</p>
              <div className="about-college-meta">
                <span><MapPin size={13}/> Gwalior, MP 474005</span>
                <span><Globe size={13}/> <a href="https://www.mitsgwl.ac.in" target="_blank" rel="noreferrer">mitsgwl.ac.in</a></span>
              </div>
              <p className="about-college-desc">
                MITS Gwalior is a premier engineering institution under Jiwaji University, known for its
                academic excellence, research culture, and industry connections. The institution runs
                internship programs across all engineering branches, requiring systematic tracking and
                documentation — which is exactly what InternTrack provides.
              </p>
            </div>
            <div className="about-college-stats">
              <div className="about-cstat"><div className="about-cstat-val">6000+</div><div className="about-cstat-lbl">Students</div></div>
              <div className="about-cstat"><div className="about-cstat-val">200+</div><div className="about-cstat-lbl">Faculty</div></div>
              <div className="about-cstat"><div className="about-cstat-val">15+</div><div className="about-cstat-lbl">Departments</div></div>
              <div className="about-cstat"><div className="about-cstat-val">30+</div><div className="about-cstat-lbl">Years</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="about-section" style={{ background: 'var(--c-surface2)' }}>
        <div className="about-inner">
          <div className="about-section-hd" data-animate>
            <span className="about-tag">Mission</span>
            <h2 className="about-h2">Why InternTrack Exists</h2>
          </div>
          <div className="about-mission" data-animate>
            <div className="about-mission-text">
              <p>
                Before InternTrack, managing internship submissions at MITS involved spreadsheets,
                emails back and forth, and manual tracking — leading to missed deadlines, lost documents,
                and frustrated students and mentors alike.
              </p>
              <p>
                InternTrack was built to replace that chaos with a structured, digital workflow where
                every step — from registration to final report — is tracked, reviewable, and transparent
                for all parties involved.
              </p>
              <p>
                Our goal: every MITS student completes their internship with proper documentation,
                mentor oversight, and a clean record of their professional growth.
              </p>
            </div>
            <div className="about-mission-values">
              {values.map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="about-value-item">
                  <div className="about-value-icon"><Icon size={18} color="#4F46E5"/></div>
                  <div>
                    <div className="about-value-title">{title}</div>
                    <div className="about-value-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="about-section">
        <div className="about-inner">
          <div className="about-section-hd" data-animate>
            <span className="about-tag">Timeline</span>
            <h2 className="about-h2">Project Journey</h2>
          </div>
          <div className="about-timeline" data-animate>
            {milestones.map(({ year, title, desc }, i) => (
              <div key={i} className="about-milestone">
                <div className="about-milestone-year">{year}</div>
                <div className="about-milestone-dot"/>
                <div className="about-milestone-content">
                  <h3 className="about-milestone-title">{title}</h3>
                  <p className="about-milestone-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-cta-inner" data-animate>
          <h2 className="about-cta-title">Start Your Journey</h2>
          <p className="about-cta-sub">Join hundreds of MITS students managing their internships on InternTrack.</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="about-cta-btn" onClick={() => navigate('/login')}>
              Login <ArrowRight size={15}/>
            </button>
            <button className="about-cta-btn outline" onClick={() => navigate('/features')}>
              See Features
            </button>
          </div>
        </div>
      </section>

      <div className="about-footer">
        <span>© 2025 InternTrack — MITS Gwalior</span>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:'12.5px' }}>
          Back to Home →
        </button>
      </div>

      <style>{`
        .about-root{
          --c-bg:#FAFAFA; --c-surface:#fff; --c-surface2:#F4F4F5;
          --c-border:#E4E4E7; --c-text:#09090B; --c-text2:#52525B; --c-text3:#A1A1AA;
          --c-primary:#4F46E5; --c-pl:#EEF2FF;
          --font-d:'Georgia',serif; --font-b:-apple-system,'Segoe UI',sans-serif;
          background:var(--c-bg); color:var(--c-text); font-family:var(--font-b); min-height:100vh;
        }
        .about-root.dark{
          --c-bg:#09090B; --c-surface:#18181B; --c-surface2:#27272A;
          --c-border:#3F3F46; --c-text:#FAFAFA; --c-text2:#A1A1AA; --c-text3:#71717A; --c-pl:#1E1B4B;
        }
        [data-animate]{ opacity:0; transform:translateY(20px); transition:opacity .5s, transform .5s; }
        [data-animate].in-view{ opacity:1; transform:none; }

        .about-nav{ position:sticky; top:0; z-index:100; background:var(--c-surface); border-bottom:1px solid var(--c-border); }
        .about-nav-inner{ max-width:1100px; margin:0 auto; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; }
        .about-back,.about-theme{ display:flex; align-items:center; gap:6px; background:none; border:1px solid var(--c-border); border-radius:8px; padding:7px 14px; font-size:13px; font-weight:500; color:var(--c-text2); cursor:pointer; transition:all .15s; }
        .about-theme{ padding:7px; width:36px; height:36px; justify-content:center; }
        .about-back:hover,.about-theme:hover{ background:var(--c-surface2); color:var(--c-text); }
        .about-brand{ display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:var(--c-text); }
        .about-brand-icon{ width:28px; height:28px; background:#4F46E5; border-radius:7px; display:flex; align-items:center; justify-content:center; }

        .about-hero{ padding:80px 24px 60px; text-align:center; background:linear-gradient(180deg,var(--c-pl),var(--c-bg)); }
        .about-hero-inner{ max-width:600px; margin:0 auto; }
        .about-tag{ display:inline-block; padding:5px 14px; border-radius:999px; background:var(--c-pl); color:var(--c-primary); font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; margin-bottom:16px; }
        .about-h1{ font-family:var(--font-d); font-size:clamp(28px,5vw,48px); font-weight:700; color:var(--c-text); margin:0 0 16px; letter-spacing:-.02em; line-height:1.15; }
        .about-accent{ background:linear-gradient(135deg,#4F46E5,#0891B2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .about-hero-sub{ font-size:16px; color:var(--c-text2); line-height:1.7; margin:0; }

        .about-section{ padding:72px 24px; }
        .about-inner{ max-width:1100px; margin:0 auto; }
        .about-section-hd{ text-align:center; margin-bottom:48px; }
        .about-h2{ font-family:var(--font-d); font-size:clamp(22px,3.5vw,36px); font-weight:700; color:var(--c-text); margin:0 0 10px; letter-spacing:-.02em; }

        .about-college-card{ background:var(--c-surface); border:1px solid var(--c-border); border-radius:16px; padding:40px; box-shadow:0 4px 20px rgba(0,0,0,.06); }
        .about-college-badge{ display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; background:var(--c-pl); color:var(--c-primary); font-size:11.5px; font-weight:600; margin-bottom:12px; }
        .about-college-name{ font-family:var(--font-d); font-size:clamp(18px,3vw,28px); font-weight:700; color:var(--c-text); margin:0 0 4px; }
        .about-college-sub{ font-size:15px; color:var(--c-primary); font-weight:600; margin:0 0 14px; }
        .about-college-meta{ display:flex; gap:20px; flex-wrap:wrap; font-size:13px; color:var(--c-text3); margin-bottom:18px; }
        .about-college-meta a{ color:var(--c-primary); text-decoration:none; }
        .about-college-meta span{ display:flex; align-items:center; gap:5px; }
        .about-college-desc{ font-size:14px; color:var(--c-text2); line-height:1.7; margin:0 0 28px; max-width:700px; }
        .about-college-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media(max-width:600px){ .about-college-stats{ grid-template-columns:repeat(2,1fr); } }
        .about-cstat{ text-align:center; background:var(--c-surface2); border-radius:10px; padding:16px; border:1px solid var(--c-border); }
        .about-cstat-val{ font-size:22px; font-weight:800; color:var(--c-primary); }
        .about-cstat-lbl{ font-size:12px; color:var(--c-text3); margin-top:4px; }

        .about-mission{ display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }
        @media(max-width:768px){ .about-mission{ grid-template-columns:1fr; } }
        .about-mission-text p{ font-size:15px; color:var(--c-text2); line-height:1.75; margin:0 0 16px; }
        .about-mission-values{ display:flex; flex-direction:column; gap:16px; }
        .about-value-item{ display:flex; align-items:flex-start; gap:14px; padding:16px; border-radius:12px; background:var(--c-surface); border:1px solid var(--c-border); }
        .about-value-icon{ width:36px; height:36px; border-radius:8px; background:var(--c-pl); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .about-value-title{ font-size:13.5px; font-weight:700; color:var(--c-text); margin-bottom:4px; }
        .about-value-desc{ font-size:12.5px; color:var(--c-text2); line-height:1.55; }

        .about-timeline{ position:relative; padding-left:32px; border-left:2px solid var(--c-border); display:flex; flex-direction:column; gap:32px; max-width:600px; margin:0 auto; }
        .about-milestone{ position:relative; }
        .about-milestone-dot{ position:absolute; left:-38px; top:20px; width:12px; height:12px; border-radius:50%; background:var(--c-primary); border:3px solid var(--c-surface); box-shadow:0 0 0 2px var(--c-primary); }
        .about-milestone-year{ font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--c-primary); margin-bottom:6px; }
        .about-milestone-content{ background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; padding:18px 20px; }
        .about-milestone-title{ font-size:15px; font-weight:700; color:var(--c-text); margin:0 0 6px; }
        .about-milestone-desc{ font-size:13px; color:var(--c-text2); line-height:1.6; margin:0; }

        .about-cta{ padding:72px 24px; text-align:center; background:linear-gradient(135deg,#4F46E5,#0891B2); }
        .about-cta-inner{ max-width:480px; margin:0 auto; }
        .about-cta-title{ font-family:var(--font-d); font-size:clamp(22px,4vw,36px); font-weight:700; color:#fff; margin:0 0 12px; }
        .about-cta-sub{ font-size:15px; color:rgba(255,255,255,.8); margin:0 0 28px; }
        .about-cta-btn{ display:inline-flex; align-items:center; gap:7px; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:all .15s; }
        .about-cta-btn:not(.outline){ background:#fff; color:#4F46E5; border:none; box-shadow:0 4px 14px rgba(0,0,0,.2); }
        .about-cta-btn:not(.outline):hover{ transform:translateY(-2px); }
        .about-cta-btn.outline{ background:transparent; color:#fff; border:2px solid rgba(255,255,255,.5); }
        .about-cta-btn.outline:hover{ background:rgba(255,255,255,.1); }

        .about-footer{ background:#09090B; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; font-size:12.5px; color:#71717A; flex-wrap:wrap; gap:8px; }
      `}</style>
    </div>
  );
};

export default AboutPage;