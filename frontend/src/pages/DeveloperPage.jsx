import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Linkedin,
  GraduationCap, Layers,
  BookOpen, Trophy, ExternalLink
} from 'lucide-react';
import SharedNavbar from './shared/Sharednavbar';
import SharedFooter from './shared/Sharedfooter';

const DeveloperPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('theme');
    if (s) setDarkMode(s === 'dark');
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

  const techStack = ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'Tailwind CSS'];

  const achievements = [
    {
      title: 'Founder & CEO — SF SmartLabs',
      desc: 'EdTech platform offering virtual labs and school/coaching management solutions.',
      link: 'https://sfsmartlabs.in',
      color: '#4F46E5',
    },
    {
      title: 'Intern — The Menta (Software Engineer)',
      desc: 'Developed the official website for The Menta as a software engineering intern.',
      link: 'https://thementa.co.in/developer',
      color: '#059669',
    },
    {
      title: 'Software Engineer — IETE Bhopal',
      desc: 'Built two official websites for the IETE Bhopal chapter.',
      link: 'https://ieteb.org',
      link2: 'https://ietebhopal.org',
      color: '#D97706',
    },
    {
      title: 'iCONECCT-2025 Conference Website',
      desc: 'Developed the official MITS-DU iCONECCT-2025 international conference website.',
      link: 'https://iconeect.mitsgwalior.in/',
      color: '#0891B2',
    },
  ];

  const projects = [
    { name: 'InternTrack', desc: 'Internship & project management platform for MITS Gwalior. Full-stack MERN application.', tag: 'Current Project', color: '#4F46E5' },
    { name: 'SmartLabs', desc: 'EdTech startup building smart laboratory management tools for engineering colleges.', tag: 'Startup', color: '#059669' },
    { name: 'Dizyno', desc: 'Digital transformation startup focused on helping local businesses go online efficiently.', tag: 'Startup', color: '#D97706' },
  ];

  const faculty = [
    {
      name: 'Dr. Praveen Bansal',
      department: 'Associate Professor and Head, Centre for IoT',
      photo: 'https://res.cloudinary.com/duuwtk3r5/image/upload/v1774531312/praveenbansal_kalu2r.jpg',
      initials: 'PB',
      gradient: 'linear-gradient(135deg,#7C3AED,#EC4899)',
    },
    {
      name: 'Atul Chauhan',
      department: 'Programmer, Madhav Institute of Technology and Science - DU',
      photo: 'https://res.cloudinary.com/duuwtk3r5/image/upload/v1774531286/atulsir_sdpgkx.png',
      initials: 'AC',
      gradient: 'linear-gradient(135deg,#4F46E5,#0891B2)',
    },
    {
      name: 'Dr. Dhananjay Bisen',
      department: 'Assistant Professor, Centre for IoT',
      photo: 'https://res.cloudinary.com/duuwtk3r5/image/upload/v1774531377/dhanajay_bisen_rew8lm.jpg',
      initials: 'DB',
      gradient: 'linear-gradient(135deg,#059669,#0891B2)',
    },
    {
      name: 'Dr. Saurabh Kumar Rajput',
      department: 'Assistant Professor, Centre for IoT',
      photo: 'https://res.cloudinary.com/duuwtk3r5/image/upload/v1774531258/SourabhKumarRajput_wvuaf7.jpg',
      initials: 'SKR',
      gradient: 'linear-gradient(135deg,#D97706,#DC2626)',
    },
  ];

  return (
    <div className={`dev-root ${darkMode ? 'dark' : ''}`}>

      <SharedNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigateToLogin={() => navigate('/login')}
      />

      {/* Hero */}
      <section className="dev-hero">
        <div className="dev-hero-bg"/>
        <div className="dev-hero-inner">
          <span className="dev-tag" data-animate>The Team Behind InternTrack</span>
          <h1 className="dev-h1" data-animate>
            Built by <span className="dev-accent">MITS Students</span>,<br/>
            for MITS Students
          </h1>
          <p className="dev-hero-sub" data-animate>
            InternTrack was conceptualized and developed as a college project under expert faculty guidance
            to solve the real problem of internship management at MITS Gwalior.
          </p>
        </div>
      </section>

      {/* ── Developer Section ─────────────────────────────────────── */}
      <section className="dev-section">
        <div className="dev-inner">

          {/* Section header — compact pill + divider layout */}
          <div className="dev-section-hd" data-animate>
            <div className="dev-section-hd-inner">
              <span className="dev-tag dev-tag-section">Developer</span>
              <div className="dev-section-divider"/>
            </div>
          </div>

          {/* Main developer card */}
          <div className="developer-card" data-animate>
            <div className="dev-card-left">
              <div className="dev-img-wrap">
                <div className="dev-img-bg"/>
                <img
                  src="https://res.cloudinary.com/dfdao7uep/image/upload/v1763400433/Abrar-removebg-preview_1_kpx2ye.png"
                  alt="Mo Abrar Qureshi"
                  className="dev-img"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                />
                <div className="dev-img-fallback" style={{ display: 'none' }}>AQ</div>
              </div>
              <div className="dev-status-badge">
                <span className="dev-status-dot"/>
                Available for Projects
              </div>
            </div>

            <div className="dev-card-right">
              <div className="dev-college-badge">
                <GraduationCap size={13}/>
                B.Tech — MITS Gwalior
              </div>
              <h3 className="dev-name">Mo Abrar Qureshi</h3>
              <p className="dev-title">Software Engineer &amp; Startup Builder</p>
              <p className="dev-bio">
                B.Tech student at MITS Gwalior with 2+ years of hands-on experience building
                full-stack web applications. Founder of SmartLabs — focused on
                education technology and digital transformation. Passionate about creating software
                that solves real problems.
              </p>
              <div className="dev-stats">
                <div className="dev-stat">
                  <div className="dev-stat-val">2+</div>
                  <div className="dev-stat-lbl">Years Exp.</div>
                </div>
                <div className="dev-stat">
                  <div className="dev-stat-val">15+</div>
                  <div className="dev-stat-lbl">Projects</div>
                </div>
                <div className="dev-stat">
                  <div className="dev-stat-val">2</div>
                  <div className="dev-stat-lbl">Startups</div>
                </div>
              </div>
              <div className="dev-tech-section">
                <div className="dev-tech-label">Tech Stack</div>
                <div className="dev-tech-list">
                  {techStack.map((t, i) => (
                    <span key={i} className="dev-tech-pill">{t}</span>
                  ))}
                </div>
              </div>
              <div className="dev-actions">
                <a href="mailto:moabrarqureshi786@gmail.com" className="dev-btn primary">
                  <Mail size={14}/> Email Me
                </a>
                <a href="https://linkedin.com/in/moabrarqureshi" target="_blank" rel="noreferrer" className="dev-btn secondary">
                  <Linkedin size={14}/> LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* ── Education + Achievements row ───────────────────────── */}
          <div className="dev-details-row" data-animate>

            {/* Education */}
            <div className="dev-detail-card">
              <div className="dev-detail-card-hd">
                <div className="dev-detail-icon" style={{ background: '#EEF2FF' }}>
                  <BookOpen size={16} color="#4F46E5"/>
                </div>
                <h4 className="dev-detail-title">Education</h4>
              </div>
              <div className="edu-block">
                <div className="edu-logo-wrap">
                  <div className="edu-logo-ring"/>
                  <div className="edu-logo-inner">MITS</div>
                </div>
                <div className="edu-info">
                  <p className="edu-institute">Madhav Institute of Technology &amp; Science-DU, Gwalior</p>
                  <p className="edu-degree">B.Tech — Centre for IoT</p>
                  <span className="edu-duration">Aug 2023 – June 2027</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="dev-detail-card">
              <div className="dev-detail-card-hd">
                <div className="dev-detail-icon" style={{ background: '#FEF9C3' }}>
                  <Trophy size={16} color="#D97706"/>
                </div>
                <h4 className="dev-detail-title">Key Achievements</h4>
              </div>
              <div className="ach-list">
                {achievements.map(({ title, desc, link, link2, color }, i) => (
                  <div className="ach-item" key={i}>
                    <div className="ach-dot" style={{ background: color }}/>
                    <div className="ach-body">
                      <p className="ach-title">{title}</p>
                      <p className="ach-desc">{desc}</p>
                      <div className="ach-links">
                        <a href={link} target="_blank" rel="noreferrer" className="ach-link" style={{ color }}>
                          <ExternalLink size={11}/> {link.replace('https://', '')}
                        </a>
                        {link2 && (
                          <a href={link2} target="_blank" rel="noreferrer" className="ach-link" style={{ color }}>
                            <ExternalLink size={11}/> {link2.replace('https://', '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Faculty / Under Guidance ──────────────────────────────── */}
      <section className="dev-section" style={{ background: 'var(--c-surface2)' }}>
        <div className="dev-inner">
          <div className="dev-section-hd" data-animate>
            <div className="dev-section-hd-inner">
              <span className="dev-tag">Project Guidance</span>
              <div className="dev-section-divider"/>
            </div>
            <h2 className="dev-h2">Developed Under the Guidance of</h2>
          </div>
          <div className="faculty-grid" data-animate>
            {faculty.map(({ name, department, photo, initials, gradient }, i) => (
              <div className="faculty-card" key={i}>
                <div className="faculty-avatar-wrap">
                  <div className="faculty-avatar-ring" style={{ background: gradient }}/>
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="faculty-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="faculty-avatar-fallback"
                    style={{ background: gradient, display: photo ? 'none' : 'flex' }}
                  >
                    {initials}
                  </div>
                </div>
                <div className="faculty-info">
                  <h3 className="faculty-name">{name}</h3>
                  <p className="faculty-dept">{department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SharedFooter />

      <style>{`
        .dev-root {
          --c-bg:#FAFAFA; --c-surface:#fff; --c-surface2:#F4F4F5;
          --c-border:#E4E4E7; --c-text:#09090B; --c-text2:#52525B; --c-text3:#A1A1AA;
          --c-primary:#4F46E5; --c-pl:#EEF2FF;
          --font-d:'Georgia',serif; --font-b:-apple-system,'Segoe UI',sans-serif;
          background:var(--c-bg); color:var(--c-text); font-family:var(--font-b);
          min-height:100vh;
        }
        .dev-root.dark {
          --c-bg:#09090B; --c-surface:#18181B; --c-surface2:#27272A;
          --c-border:#3F3F46; --c-text:#FAFAFA; --c-text2:#A1A1AA; --c-text3:#71717A;
          --c-pl:#1E1B4B;
        }
        [data-animate]{ opacity:0; transform:translateY(20px); transition:opacity .55s, transform .55s; }
        [data-animate].in-view{ opacity:1; transform:none; }

        /* ── Hero — tighter vertical rhythm ────────────────────── */
        .dev-hero{ position:relative; padding:64px 24px 52px; text-align:center; overflow:hidden; }
        .dev-hero-bg{
          position:absolute; inset:0;
          background:linear-gradient(135deg, var(--c-pl) 0%, var(--c-bg) 60%);
          opacity:.7; pointer-events:none;
        }
        .dev-hero-inner{ position:relative; max-width:620px; margin:0 auto; }

        .dev-tag{
          display:inline-block; padding:5px 14px; border-radius:999px;
          background:var(--c-pl); color:var(--c-primary);
          font-size:11.5px; font-weight:600; letter-spacing:.06em;
          text-transform:uppercase; margin-bottom:16px;
        }

        /* ── Section header — compact pill with flanking line ─── */
        .dev-section-hd{ text-align:center; margin-bottom:28px; }
        .dev-section-hd-inner{
          display:inline-flex; align-items:center; gap:14px; margin-bottom:10px;
        }
        .dev-section-divider{
          width:48px; height:2px; border-radius:2px;
          background:linear-gradient(90deg,var(--c-primary),transparent);
        }
        /* "Developer" section label — normal pill size, not giant */
        .dev-tag-section{
          font-size:13px; padding:6px 18px; border-radius:999px;
          background:var(--c-pl); color:var(--c-primary);
          font-weight:700; letter-spacing:.08em; text-transform:uppercase;
        }

        .dev-h1{
          font-family:var(--font-d); font-size:clamp(28px,5vw,48px);
          font-weight:700; color:var(--c-text); margin:0 0 18px; letter-spacing:-.02em; line-height:1.15;
        }
        .dev-accent{
          background:linear-gradient(135deg,#4F46E5,#0891B2);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .dev-hero-sub{ font-size:16px; color:var(--c-text2); line-height:1.7; margin:0; }

        .dev-section{ padding:56px 24px; }
        .dev-inner{ max-width:1100px; margin:0 auto; }

        .dev-h2{
          font-family:var(--font-d); font-size:clamp(22px,3.5vw,32px);
          font-weight:700; color:var(--c-text); margin:6px 0 0; letter-spacing:-.02em;
        }

        /* ── Developer Card ─────────────────────────────────────── */
        .developer-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:16px; padding:36px 40px; display:grid;
          grid-template-columns:auto 1fr; gap:44px; align-items:start;
          box-shadow:0 4px 20px rgba(0,0,0,.06); margin-bottom:20px;
        }
        @media(max-width:768px){ .developer-card{ grid-template-columns:1fr; gap:24px; padding:28px 20px; } }
        .dev-card-left{ display:flex; flex-direction:column; align-items:center; gap:14px; }
        .dev-img-wrap{ position:relative; width:170px; height:170px; flex-shrink:0; }
        .dev-img-bg{
          position:absolute; inset:-5px; border-radius:50%;
          background:linear-gradient(135deg,#4F46E5,#0891B2);
          animation:spin 8s linear infinite; z-index:0;
        }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        .dev-img{
          width:170px; height:170px; border-radius:50%;
          object-fit:cover; position:relative; z-index:1;
          border:4px solid var(--c-surface);
        }
        .dev-img-fallback{
          background:#4F46E5; color:#fff; font-size:32px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          width:170px; height:170px; border-radius:50%;
          position:relative; z-index:1; border:4px solid var(--c-surface);
        }
        .dev-status-badge{
          display:flex; align-items:center; gap:7px; padding:6px 14px; border-radius:999px;
          background:#DCFCE7; border:1px solid #BBF7D0; font-size:12px; font-weight:600; color:#166534;
        }
        .dev-root.dark .dev-status-badge{ background:#14532D33; border-color:#166534; color:#4ADE80; }
        .dev-status-dot{ width:7px; height:7px; border-radius:50%; background:#22C55E; animation:pulse 2s infinite; }
        @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }
        .dev-card-right{ flex:1; }
        .dev-college-badge{
          display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px;
          background:var(--c-pl); color:var(--c-primary); font-size:11.5px; font-weight:600; margin-bottom:12px;
        }
        .dev-name{ font-family:var(--font-d); font-size:30px; font-weight:700; color:var(--c-text); margin:0 0 4px; letter-spacing:-.01em; }
        .dev-title{ font-size:15px; color:var(--c-primary); font-weight:600; margin:0 0 14px; }
        .dev-bio{ font-size:14.5px; color:var(--c-text2); line-height:1.7; margin:0 0 20px; }
        .dev-stats{ display:flex; gap:20px; margin-bottom:20px; padding:14px 20px; background:var(--c-surface2); border-radius:12px; border:1px solid var(--c-border); width:fit-content; }
        .dev-stat{ text-align:center; }
        .dev-stat-val{ font-size:22px; font-weight:800; color:var(--c-primary); line-height:1; }
        .dev-stat-lbl{ font-size:11px; color:var(--c-text3); margin-top:4px; }
        .dev-tech-section{ margin-bottom:20px; }
        .dev-tech-label{ font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--c-text3); margin-bottom:9px; }
        .dev-tech-list{ display:flex; flex-wrap:wrap; gap:7px; }
        .dev-tech-pill{
          padding:5px 12px; border-radius:7px;
          background:var(--c-surface2); border:1px solid var(--c-border);
          font-size:12px; font-weight:500; color:var(--c-text2);
          transition:border-color .15s, color .15s;
        }
        .dev-tech-pill:hover{ border-color:var(--c-primary); color:var(--c-primary); }
        .dev-actions{ display:flex; flex-wrap:wrap; gap:10px; }
        .dev-btn{
          display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px;
          font-size:13px; font-weight:600; cursor:pointer; text-decoration:none;
          transition:transform .15s, box-shadow .15s;
        }
        .dev-btn:hover{ transform:translateY(-2px); }
        .dev-btn.primary{ background:var(--c-primary); color:#fff; box-shadow:0 4px 12px rgba(79,70,229,.3); }
        .dev-btn.primary:hover{ box-shadow:0 6px 18px rgba(79,70,229,.4); }
        .dev-btn.secondary{ background:var(--c-surface2); color:var(--c-text2); border:1px solid var(--c-border); }
        .dev-btn.secondary:hover{ color:var(--c-text); }

        /* ── Education + Achievements Row ───────────────────────── */
        .dev-details-row{
          display:grid; grid-template-columns:1fr 1.6fr; gap:20px; align-items:start;
        }
        @media(max-width:860px){ .dev-details-row{ grid-template-columns:1fr; } }

        .dev-detail-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:16px; padding:24px 28px;
          box-shadow:0 2px 12px rgba(0,0,0,.05);
        }
        .dev-detail-card-hd{ display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .dev-detail-icon{
          width:32px; height:32px; border-radius:9px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .dev-root.dark .dev-detail-icon{ filter:brightness(.85); }
        .dev-detail-title{ font-size:14.5px; font-weight:700; color:var(--c-text); margin:0; }

        /* Education */
        .edu-block{ display:flex; gap:16px; align-items:flex-start; }
        .edu-logo-wrap{ position:relative; width:52px; height:52px; flex-shrink:0; }
        .edu-logo-ring{
          position:absolute; inset:-2px; border-radius:12px;
          background:linear-gradient(135deg,#4F46E5,#0891B2);
        }
        .edu-logo-inner{
          position:relative; z-index:1; width:52px; height:52px; border-radius:11px;
          background:var(--c-surface); border:2px solid var(--c-surface);
          display:flex; align-items:center; justify-content:center;
          font-size:10px; font-weight:800; color:var(--c-primary); letter-spacing:.05em;
        }
        .edu-info{ flex:1; }
        .edu-institute{ font-size:13.5px; font-weight:700; color:var(--c-text); margin:0 0 4px; line-height:1.4; }
        .edu-degree{ font-size:13px; color:var(--c-primary); font-weight:600; margin:0 0 8px; }
        .edu-duration{
          display:inline-block; padding:3px 10px; border-radius:999px;
          background:var(--c-surface2); border:1px solid var(--c-border);
          font-size:11.5px; color:var(--c-text3); font-weight:500;
        }

        /* Achievements */
        .ach-list{ display:flex; flex-direction:column; gap:14px; }
        .ach-item{ display:flex; gap:13px; align-items:flex-start; }
        .ach-dot{ width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
        .ach-body{ flex:1; }
        .ach-title{ font-size:13.5px; font-weight:700; color:var(--c-text); margin:0 0 3px; }
        .ach-desc{ font-size:12.5px; color:var(--c-text2); margin:0 0 6px; line-height:1.5; }
        .ach-links{ display:flex; flex-wrap:wrap; gap:8px; }
        .ach-link{
          display:inline-flex; align-items:center; gap:4px;
          font-size:11.5px; font-weight:600; text-decoration:none;
          opacity:.85; transition:opacity .15s;
        }
        .ach-link:hover{ opacity:1; text-decoration:underline; }

        /* ── Faculty Grid ───────────────────────────────────────── */
        .faculty-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        @media(max-width:900px){ .faculty-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:500px){ .faculty-grid{ grid-template-columns:1fr; } }

        .faculty-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:16px; padding:24px 18px;
          display:flex; flex-direction:column; align-items:center;
          text-align:center; gap:14px;
          box-shadow:0 2px 12px rgba(0,0,0,.05);
          transition:transform .2s, box-shadow .2s;
        }
        .faculty-card:hover{ transform:translateY(-4px); box-shadow:0 8px 28px rgba(0,0,0,.1); }
        .faculty-avatar-wrap{ position:relative; width:88px; height:88px; flex-shrink:0; }
        .faculty-avatar-ring{ position:absolute; inset:-3px; border-radius:50%; z-index:0; }
        .faculty-avatar{
          width:88px; height:88px; border-radius:50%;
          object-fit:cover; position:relative; z-index:1;
          border:3px solid var(--c-surface);
        }
        .faculty-avatar-fallback{
          width:88px; height:88px; border-radius:50%;
          color:#fff; font-size:22px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          position:relative; z-index:1; border:3px solid var(--c-surface);
        }
        .faculty-info{ display:flex; flex-direction:column; gap:5px; }
        .faculty-name{ font-family:var(--font-d); font-size:14.5px; font-weight:700; color:var(--c-text); margin:0; line-height:1.3; }
        .faculty-dept{ font-size:11.5px; color:var(--c-text3); margin:0; line-height:1.5; }
      `}</style>
    </div>
  );
};

export default DeveloperPage;