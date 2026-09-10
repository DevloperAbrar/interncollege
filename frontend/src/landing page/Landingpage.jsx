// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   ArrowRight, ChevronRight, Menu, X, Sun, Moon,
//   Users, BookOpen, TrendingUp, CheckCircle, Award,
//   BarChart3, Shield, Clock, FileText, Star,
//   Linkedin, Mail, Github, GraduationCap, Building2,
//   MapPin, Zap, ChevronDown
// } from 'lucide-react';

// const LandingPage = ({ onNavigateToLogin }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [activeStep, setActiveStep] = useState(0);
//   const heroRef = useRef(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const saved = localStorage.getItem('theme');
//     if (saved) setDarkMode(saved === 'dark');
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('theme', darkMode ? 'dark' : 'light');
//   }, [darkMode]);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 20);
//       // Animate sections on scroll
//       document.querySelectorAll('[data-animate]').forEach(el => {
//         const rect = el.getBoundingClientRect();
//         if (rect.top < window.innerHeight - 80) {
//           el.classList.add('in-view');
//         }
//       });
//     };
//     window.addEventListener('scroll', handleScroll);
//     // Trigger once on mount
//     setTimeout(() => handleScroll(), 100);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Auto-rotate steps
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActiveStep(prev => (prev + 1) % 4);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   const scrollTo = (id) => {
//     document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
//     setIsMenuOpen(false);
//   };

//   const stats = [
//     { value: '500+', label: 'Active Students', icon: Users },
//     { value: '200+', label: 'Completed Projects', icon: CheckCircle },
//     { value: '50+', label: 'Partner Companies', icon: Building2 },
//     { value: '95%', label: 'Success Rate', icon: Award },
//   ];

//   const features = [
//     {
//       icon: Users,
//       title: 'Student Management',
//       desc: 'Streamlined registration with secure authentication. Bulk upload via CSV/Excel, role-based access for admins, mentors and students.',
//       color: '#4F46E5',
//       bg: '#EEF2FF',
//     },
//     {
//       icon: FileText,
//       title: 'Internship Tracking',
//       desc: 'Submit offer letters, NOC, stipend proofs. Track 6th, 7th, 8th semester internships and 8th semester projects separately.',
//       color: '#0891B2',
//       bg: '#ECFEFF',
//     },
//     {
//       icon: BarChart3,
//       title: 'Progress Monitoring',
//       desc: 'MPR submissions (mpr1, mpr2, mpr3, midSem1) with mentor review workflows. Final report submission after all MPRs are approved.',
//       color: '#059669',
//       bg: '#ECFDF5',
//     },
//     {
//       icon: Shield,
//       title: 'Mentor Review System',
//       desc: 'Mentors can approve or reject registrations, MPR documents, and final reports. Email notifications at every stage.',
//       color: '#D97706',
//       bg: '#FFFBEB',
//     },
//     {
//       icon: TrendingUp,
//       title: 'Analytics Dashboard',
//       desc: 'Comprehensive insights — company-wise, location-wise, stipend distribution, domain breakdown, and monthly trends.',
//       color: '#7C3AED',
//       bg: '#F5F3FF',
//     },
//     {
//       icon: Zap,
//       title: 'Admin Control Panel',
//       desc: 'Full admin control: create/manage mentors, assign students, bulk upload, export Excel reports for all submission types.',
//       color: '#E11D48',
//       bg: '#FFF1F2',
//     },
//   ];

//   const steps = [
//     {
//       num: '01',
//       title: 'Register & Login',
//       desc: 'Students receive login credentials after admin bulk upload. Login with your enrollment number and college email.',
//       detail: 'Admin bulk-uploads student data via CSV. System auto-assigns mentors based on capacity.',
//     },
//     {
//       num: '02',
//       title: 'Choose Semester Type',
//       desc: 'Select from 6th Internship, 7th Internship, 8th Internship, 8th Project, or Any Other Internship.',
//       detail: 'The system intelligently shows only eligible semester types based on your previous completions.',
//     },
//     {
//       num: '03',
//       title: 'Submit Registration',
//       desc: 'Fill internship details — company, dates, mentor info, stipend. Upload offer letter, NOC, and stipend proof.',
//       detail: 'Your assigned mentor reviews and approves or rejects with feedback via the dashboard.',
//     },
//     {
//       num: '04',
//       title: 'MPRs & Final Report',
//       desc: 'For 7th/8th semester: Submit 4 MPR documents (MPR1, MPR2, MPR3, MidSem1). Then submit final report.',
//       detail: 'All 4 MPRs must be approved by mentor before final report unlock. Completion marks the internship done.',
//     },
//   ];

//   const internshipTypes = [
//     { type: '6th Semester Internship', path: 'Direct → Registration → Final Report', color: '#4F46E5', tag: '2 Steps' },
//     { type: '7th Semester Internship', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#0891B2', tag: '6 Steps' },
//     { type: '8th Semester Internship', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#059669', tag: '6 Steps' },
//     { type: '8th Semester Project', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#7C3AED', tag: '6 Steps' },
//     { type: 'Any Other Internship', path: 'Direct → Registration → Final Report', color: '#D97706', tag: '2 Steps' },
//   ];

//   const testimonials = [
//     { name: 'Rahul Sharma', role: 'CSE Student, 2024', text: 'The MPR tracking system is so organized. My mentor reviewed everything within a day and gave clear feedback.', rating: 5 },
//     { name: 'Prof. Meena Tiwari', role: 'Mentor, MITS Gwalior', text: 'Managing 20+ students is now effortless. I can see all pending reviews in one place and approve with one click.', rating: 5 },
//     { name: 'Dr. Anil Verma', role: 'Coordinator, IoT Dept.', text: 'The analytics dashboard gives us real-time insights into placement rates and company distributions.', rating: 5 },
//   ];

//   return (
//     <div className={`landing-root ${darkMode ? 'dark' : 'light'}`}>

//       {/* ── NAV ─────────────────────────────────────────────────────────── */}
//       <nav className={`nav-bar ${isScrolled ? 'nav-scrolled' : ''}`}>
//         <div className="nav-inner">
//           <div className="nav-brand">
//             <div className="brand-icon">
//               <GraduationCap size={20} color="#fff" />
//             </div>
//             <span className="brand-name">InternTrack</span>
//           </div>

//           <div className="nav-links desktop-only">
//             {['home','features','how-it-works','testimonials'].map(id => (
//               <button key={id} className="nav-link" onClick={() => scrollTo(id)}>
//                 {id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
//               </button>
//             ))}
//             <button className="nav-link" onClick={() => navigate('/analytics')}>
//               <BarChart3 size={14} style={{marginRight:4,verticalAlign:'middle'}}/>Analytics
//             </button>
//             <button className="nav-link" onClick={() => navigate('/developer')}>Developer</button>
//           </div>

//           <div className="nav-actions">
//             <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
//               {darkMode ? <Sun size={17}/> : <Moon size={17}/>}
//             </button>
//             <button className="btn-login" onClick={onNavigateToLogin}>
//               Login <ChevronRight size={15}/>
//             </button>
//             <button className="icon-btn mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
//               {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
//             </button>
//           </div>
//         </div>

//         {/* Mobile menu */}
//         {isMenuOpen && (
//           <div className="mobile-menu">
//             {['home','features','how-it-works','testimonials'].map(id => (
//               <button key={id} className="mobile-link" onClick={() => scrollTo(id)}>
//                 {id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
//               </button>
//             ))}
//             <button className="mobile-link" onClick={() => { navigate('/analytics'); setIsMenuOpen(false); }}>Analytics</button>
//             <button className="mobile-link" onClick={() => { navigate('/developer'); setIsMenuOpen(false); }}>Developer</button>
//             <button className="mobile-link accent" onClick={onNavigateToLogin}>Login →</button>
//           </div>
//         )}
//       </nav>

//       {/* ── HERO ────────────────────────────────────────────────────────── */}
//       <section id="home" className="hero-section" ref={heroRef}>
//         <div className="hero-bg-grid"/>
//         <div className="hero-orb hero-orb-1"/>
//         <div className="hero-orb hero-orb-2"/>

//         <div className="hero-inner">
//           <div className="hero-badge" data-animate>
//             <span className="badge-dot"/>
//             Madhav Institute of Technology &amp; Science — DU Gwalior
//           </div>

//           <h1 className="hero-title" data-animate>
//             Internship &amp; Project<br/>
//             <span className="hero-gradient">Management Platform</span>
//           </h1>

//           <p className="hero-sub" data-animate>
//             The official platform for MITS students to register, track, and complete
//             internships. Mentors review submissions. Admins manage everything.
//             From 6th semester to final report — all in one place.
//           </p>

//           <div className="hero-cta" data-animate>
//             <button className="btn-primary" onClick={onNavigateToLogin}>
//               Get Started <ArrowRight size={17}/>
//             </button>
//             <button className="btn-outline" onClick={() => scrollTo('how-it-works')}>
//               How it works <ChevronDown size={17}/>
//             </button>
//           </div>

//           {/* Stats row */}
//           <div className="stats-row" data-animate>
//             {stats.map(({value, label, icon: Icon}, i) => (
//               <div className="stat-card" key={i}>
//                 <div className="stat-icon-wrap">
//                   <Icon size={18} className="stat-icon"/>
//                 </div>
//                 <div className="stat-value">{value}</div>
//                 <div className="stat-label">{label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── INTERNSHIP TYPES ────────────────────────────────────────────── */}
//       <section className="types-section">
//         <div className="section-inner">
//           <div className="section-header" data-animate>
//             <span className="section-tag">Semester Workflows</span>
//             <h2 className="section-title">5 Internship &amp; Project Types</h2>
//             <p className="section-sub">Each type has its own submission workflow. The platform guides you step by step.</p>
//           </div>
//           <div className="types-grid" data-animate>
//             {internshipTypes.map(({type, path, color, tag}, i) => (
//               <div className="type-card" key={i} style={{'--accent': color}}>
//                 <div className="type-header">
//                   <span className="type-name">{type}</span>
//                   <span className="type-tag" style={{background: color+'18', color}}>{tag}</span>
//                 </div>
//                 <div className="type-path">
//                   {path.split(' → ').map((step, j) => (
//                     <span key={j} className="path-step">
//                       <span className="step-pill" style={j===0 ? {background: color, color:'#fff'} : {}}>{step}</span>
//                       {j < path.split(' → ').length - 1 && <ChevronRight size={12} className="path-arrow"/>}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── FEATURES ────────────────────────────────────────────────────── */}
//       <section id="features" className="features-section">
//         <div className="section-inner">
//           <div className="section-header" data-animate>
//             <span className="section-tag">Platform Features</span>
//             <h2 className="section-title">Everything You Need</h2>
//             <p className="section-sub">Built for students, mentors, and administrators of MITS Gwalior.</p>
//           </div>
//           <div className="features-grid">
//             {features.map(({icon: Icon, title, desc, color, bg}, i) => (
//               <div className="feature-card" key={i} data-animate style={{'--fc': color, '--fbg': bg}}>
//                 <div className="feature-icon-box">
//                   <Icon size={22} color={color}/>
//                 </div>
//                 <h3 className="feature-title">{title}</h3>
//                 <p className="feature-desc">{desc}</p>
//                 <div className="feature-line" style={{background: color}}/>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
//       <section id="how-it-works" className="steps-section">
//         <div className="section-inner">
//           <div className="section-header" data-animate>
//             <span className="section-tag">Process</span>
//             <h2 className="section-title">How It Works</h2>
//             <p className="section-sub">Four clear stages from login to completion.</p>
//           </div>

//           <div className="steps-layout" data-animate>
//             {/* Step tabs */}
//             <div className="steps-tabs">
//               {steps.map((s, i) => (
//                 <button
//                   key={i}
//                   className={`step-tab ${activeStep === i ? 'active' : ''}`}
//                   onClick={() => setActiveStep(i)}
//                 >
//                   <span className="step-num">{s.num}</span>
//                   <span className="step-tab-title">{s.title}</span>
//                   <ChevronRight size={16} className="step-chevron"/>
//                 </button>
//               ))}
//             </div>

//             {/* Active step detail */}
//             <div className="step-detail">
//               <div className="step-detail-num">{steps[activeStep].num}</div>
//               <h3 className="step-detail-title">{steps[activeStep].title}</h3>
//               <p className="step-detail-desc">{steps[activeStep].desc}</p>
//               <div className="step-detail-box">
//                 <span className="step-detail-label">Behind the scenes</span>
//                 <p className="step-detail-inner">{steps[activeStep].detail}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
//       <section id="testimonials" className="testimonials-section">
//         <div className="section-inner">
//           <div className="section-header" data-animate>
//             <span className="section-tag">Testimonials</span>
//             <h2 className="section-title">What People Say</h2>
//           </div>
//           <div className="testimonials-grid" data-animate>
//             {testimonials.map(({name, role, text, rating}, i) => (
//               <div className="testimonial-card" key={i}>
//                 <div className="t-stars">
//                   {[...Array(rating)].map((_, j) => (
//                     <Star key={j} size={14} fill="#F59E0B" color="#F59E0B"/>
//                   ))}
//                 </div>
//                 <p className="t-text">"{text}"</p>
//                 <div className="t-author">
//                   <div className="t-avatar">{name[0]}</div>
//                   <div>
//                     <div className="t-name">{name}</div>
//                     <div className="t-role">{role}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA ─────────────────────────────────────────────────────────── */}
//       <section className="cta-section">
//         <div className="cta-inner" data-animate>
//           <h2 className="cta-title">Ready to Track Your Internship?</h2>
//           <p className="cta-sub">Login with your MITS credentials and start your internship journey today.</p>
//           <button className="btn-primary cta-btn" onClick={onNavigateToLogin}>
//             Login to InternTrack <ArrowRight size={18}/>
//           </button>
//         </div>
//       </section>

//       {/* ── FOOTER ──────────────────────────────────────────────────────── */}
//       <footer className="footer">
//         <div className="footer-inner">
//           <div className="footer-brand">
//             <div className="nav-brand" style={{marginBottom:12}}>
//               <div className="brand-icon"><GraduationCap size={18} color="#fff"/></div>
//               <span className="brand-name" style={{color:'#fff'}}>InternTrack</span>
//             </div>
//             <p className="footer-desc">
//               Official internship &amp; project management platform for<br/>
//               Madhav Institute of Technology &amp; Science — DU Gwalior.
//             </p>
//             <div className="footer-socials">
//               <a href="mailto:moabrarqureshi786@gmail.com" className="social-icon"><Mail size={16}/></a>
//               <a href="https://linkedin.com/in/moabrarqureshi" target="_blank" rel="noreferrer" className="social-icon"><Linkedin size={16}/></a>
//               <a href="https://github.com/moabrarqureshi" target="_blank" rel="noreferrer" className="social-icon"><Github size={16}/></a>
//             </div>
//           </div>

//           <div className="footer-links-group">
//             <div className="footer-col">
//               <h4 className="footer-col-title">Platform</h4>
//               {['home','features','how-it-works','testimonials'].map(id => (
//                 <button key={id} className="footer-link" onClick={() => scrollTo(id)}>
//                   {id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
//                 </button>
//               ))}
//             </div>
//             <div className="footer-col">
//               <h4 className="footer-col-title">Pages</h4>
//               <button className="footer-link" onClick={() => navigate('/analytics')}>Analytics</button>
//               <button className="footer-link" onClick={() => navigate('/developer')}>Developer</button>
//               <button className="footer-link" onClick={() => navigate('/features')}>Features</button>
//               <button className="footer-link" onClick={() => navigate('/about')}>About</button>
//             </div>
//             <div className="footer-col">
//               <h4 className="footer-col-title">Access</h4>
//               <button className="footer-link" onClick={onNavigateToLogin}>Student Login</button>
//               <button className="footer-link" onClick={onNavigateToLogin}>Mentor Login</button>
//               <button className="footer-link" onClick={onNavigateToLogin}>Admin Login</button>
//             </div>
//           </div>
//         </div>
//         <div className="footer-bottom">
//           <span>© 2025 InternTrack — MITS Gwalior. All rights reserved.</span>
//           <span>Developed with ❤️ by Mo Abrar Qureshi</span>
//         </div>
//       </footer>

//       <style>{`
//         /* ─── TOKENS ──────────────────────────────────────────────────── */
//         .landing-root {
//           --c-bg: #FAFAFA;
//           --c-surface: #FFFFFF;
//           --c-surface2: #F4F4F5;
//           --c-border: #E4E4E7;
//           --c-text: #09090B;
//           --c-text2: #52525B;
//           --c-text3: #A1A1AA;
//           --c-primary: #4F46E5;
//           --c-primary-light: #EEF2FF;
//           --c-primary-dark: #3730A3;
//           --font-display: 'Georgia', 'Times New Roman', serif;
//           --font-body: -apple-system, 'Segoe UI', sans-serif;
//           --radius: 12px;
//           --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
//           --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06);
//           --nav-h: 64px;
//           background: var(--c-bg);
//           color: var(--c-text);
//           font-family: var(--font-body);
//           min-height: 100vh;
//           overflow-x: hidden;
//         }
//         .landing-root.dark {
//           --c-bg: #09090B;
//           --c-surface: #18181B;
//           --c-surface2: #27272A;
//           --c-border: #3F3F46;
//           --c-text: #FAFAFA;
//           --c-text2: #A1A1AA;
//           --c-text3: #71717A;
//           --c-primary-light: #1E1B4B;
//           --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
//           --shadow-md: 0 4px 12px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.3);
//         }

//         /* ─── SCROLL ANIMATIONS ──────────────────────────────────────── */
//         [data-animate] { opacity:0; transform:translateY(28px); transition: opacity .6s ease, transform .6s ease; }
//         [data-animate].in-view { opacity:1; transform:translateY(0); }

//         /* ─── NAV ────────────────────────────────────────────────────── */
//         .nav-bar {
//           position: fixed; top:0; left:0; right:0; z-index:100;
//           transition: background .3s, box-shadow .3s, border-color .3s;
//           border-bottom: 1px solid transparent;
//         }
//         .nav-scrolled {
//           background: var(--c-surface);
//           border-bottom-color: var(--c-border);
//           box-shadow: 0 1px 16px rgba(0,0,0,0.06);
//         }
//         .nav-inner {
//           max-width: 1200px; margin:0 auto; padding:0 24px;
//           height: var(--nav-h); display:flex; align-items:center;
//           justify-content: space-between; gap:24px;
//         }
//         .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
//         .brand-icon {
//           width:32px; height:32px; background:var(--c-primary);
//           border-radius:8px; display:flex; align-items:center; justify-content:center;
//           flex-shrink:0;
//         }
//         .brand-name { font-size:17px; font-weight:700; color:var(--c-text); letter-spacing:-.3px; }
//         .nav-links { display:flex; align-items:center; gap:4px; }
//         .nav-link {
//           background:none; border:none; padding:7px 13px; border-radius:8px;
//           font-size:13.5px; font-weight:500; color:var(--c-text2); cursor:pointer;
//           transition: background .15s, color .15s; white-space:nowrap;
//           display:flex; align-items:center;
//         }
//         .nav-link:hover { background:var(--c-surface2); color:var(--c-text); }
//         .nav-actions { display:flex; align-items:center; gap:8px; }
//         .icon-btn {
//           width:36px; height:36px; border-radius:8px; border:1px solid var(--c-border);
//           background:var(--c-surface); color:var(--c-text2); cursor:pointer;
//           display:flex; align-items:center; justify-content:center;
//           transition: background .15s, color .15s;
//         }
//         .icon-btn:hover { background:var(--c-surface2); color:var(--c-text); }
//         .btn-login {
//           display:flex; align-items:center; gap:4px;
//           padding:8px 18px; border-radius:8px;
//           background:var(--c-primary); color:#fff; border:none;
//           font-size:13.5px; font-weight:600; cursor:pointer;
//           transition: background .15s, transform .1s;
//         }
//         .btn-login:hover { background:var(--c-primary-dark); transform:translateY(-1px); }
//         .desktop-only { display:flex; }
//         .mobile-only { display:none; }
//         @media(max-width:768px){
//           .desktop-only { display:none; }
//           .mobile-only { display:flex; }
//         }
//         .mobile-menu {
//           background:var(--c-surface); border-top:1px solid var(--c-border);
//           padding:16px 24px 20px; display:flex; flex-direction:column; gap:2px;
//         }
//         .mobile-link {
//           background:none; border:none; padding:10px 12px; border-radius:8px;
//           font-size:14px; font-weight:500; color:var(--c-text2); cursor:pointer;
//           text-align:left; transition: background .15s, color .15s;
//         }
//         .mobile-link:hover { background:var(--c-surface2); color:var(--c-text); }
//         .mobile-link.accent { color:var(--c-primary); font-weight:600; margin-top:8px; }

//         /* ─── HERO ───────────────────────────────────────────────────── */
//         .hero-section {
//           position:relative; min-height:100vh;
//           display:flex; align-items:center; justify-content:center;
//           padding: calc(var(--nav-h) + 60px) 24px 80px;
//           overflow:hidden;
//         }
//         .hero-bg-grid {
//           position:absolute; inset:0; opacity:.4;
//           background-image: linear-gradient(var(--c-border) 1px, transparent 1px),
//             linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
//           background-size:48px 48px;
//           -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
//           mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
//           pointer-events:none;
//         }
//         .hero-orb {
//           position:absolute; border-radius:50%;
//           filter:blur(80px); pointer-events:none; opacity:.25;
//         }
//         .hero-orb-1 {
//           width:480px; height:480px;
//           background:radial-gradient(circle, #818CF8 0%, #4F46E5 100%);
//           top:-120px; right:-100px;
//           animation: orbFloat 8s ease-in-out infinite;
//         }
//         .hero-orb-2 {
//           width:320px; height:320px;
//           background:radial-gradient(circle, #67E8F9 0%, #0891B2 100%);
//           bottom:-60px; left:-60px;
//           animation: orbFloat 10s ease-in-out infinite reverse;
//         }
//         @keyframes orbFloat {
//           0%,100% { transform:translateY(0) scale(1); }
//           50% { transform:translateY(-24px) scale(1.04); }
//         }
//         .hero-inner {
//           position:relative; text-align:center;
//           max-width:800px; margin:0 auto; z-index:1;
//         }
//         .hero-badge {
//           display:inline-flex; align-items:center; gap:8px;
//           padding:7px 16px; border-radius:999px;
//           background:var(--c-primary-light); border:1px solid #C7D2FE;
//           font-size:12.5px; font-weight:500; color:var(--c-primary);
//           margin-bottom:28px; letter-spacing:.01em;
//         }
//         .landing-root.dark .hero-badge { border-color:#3730A3; }
//         .badge-dot {
//           width:7px; height:7px; border-radius:50%;
//           background:var(--c-primary); animation:pulse 2s infinite;
//         }
//         @keyframes pulse {
//           0%,100% { opacity:1; } 50% { opacity:.4; }
//         }
//         .hero-title {
//           font-family: var(--font-display);
//           font-size: clamp(36px, 6vw, 64px);
//           font-weight:700; line-height:1.12;
//           color:var(--c-text); margin:0 0 24px;
//           letter-spacing:-.02em;
//         }
//         .hero-gradient {
//           background: linear-gradient(135deg, #4F46E5 0%, #0891B2 50%, #059669 100%);
//           -webkit-background-clip:text; -webkit-text-fill-color:transparent;
//           background-clip:text;
//         }
//         .hero-sub {
//           font-size:17px; color:var(--c-text2); max-width:560px;
//           margin:0 auto 36px; line-height:1.7;
//         }
//         .hero-cta { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:64px; }
//         .btn-primary {
//           display:inline-flex; align-items:center; gap:7px;
//           padding:12px 24px; border-radius:10px;
//           background:var(--c-primary); color:#fff; border:none;
//           font-size:15px; font-weight:600; cursor:pointer;
//           transition: background .15s, transform .15s, box-shadow .15s;
//           box-shadow: 0 4px 14px rgba(79,70,229,.35);
//         }
//         .btn-primary:hover { background:var(--c-primary-dark); transform:translateY(-2px); box-shadow:0 6px 20px rgba(79,70,229,.45); }
//         .btn-outline {
//           display:inline-flex; align-items:center; gap:7px;
//           padding:12px 24px; border-radius:10px;
//           background:var(--c-surface); color:var(--c-text2);
//           border:1px solid var(--c-border);
//           font-size:15px; font-weight:600; cursor:pointer;
//           transition: background .15s, transform .15s;
//         }
//         .btn-outline:hover { background:var(--c-surface2); transform:translateY(-2px); }
//         .stats-row {
//           display:grid; grid-template-columns:repeat(4,1fr); gap:16px;
//         }
//         @media(max-width:640px){ .stats-row { grid-template-columns:repeat(2,1fr); } }
//         .stat-card {
//           background:var(--c-surface); border:1px solid var(--c-border);
//           border-radius:var(--radius); padding:20px 16px;
//           text-align:center; box-shadow:var(--shadow);
//           transition: transform .2s, box-shadow .2s;
//         }
//         .stat-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
//         .stat-icon-wrap {
//           width:36px; height:36px; border-radius:8px;
//           background:var(--c-primary-light); display:flex;
//           align-items:center; justify-content:center; margin:0 auto 10px;
//         }
//         .stat-icon { color:var(--c-primary); }
//         .stat-value { font-size:24px; font-weight:800; color:var(--c-text); margin-bottom:4px; }
//         .stat-label { font-size:12px; color:var(--c-text3); font-weight:500; }

//         /* ─── TYPES ──────────────────────────────────────────────────── */
//         .types-section { padding:80px 24px; background:var(--c-surface2); }
//         .section-inner { max-width:1200px; margin:0 auto; }
//         .section-header { text-align:center; margin-bottom:52px; }
//         .section-tag {
//           display:inline-block; padding:5px 14px; border-radius:999px;
//           background:var(--c-primary-light); color:var(--c-primary);
//           font-size:12px; font-weight:600; letter-spacing:.06em;
//           text-transform:uppercase; margin-bottom:14px;
//         }
//         .section-title {
//           font-family:var(--font-display);
//           font-size:clamp(26px,4vw,40px); font-weight:700;
//           color:var(--c-text); margin:0 0 14px; letter-spacing:-.02em;
//         }
//         .section-sub { font-size:15.5px; color:var(--c-text2); max-width:480px; margin:0 auto; line-height:1.6; }
//         .types-grid { display:flex; flex-direction:column; gap:12px; }
//         .type-card {
//           background:var(--c-surface); border:1px solid var(--c-border);
//           border-radius:var(--radius); padding:18px 22px;
//           box-shadow:var(--shadow);
//           border-left:3px solid var(--accent, var(--c-primary));
//           transition: transform .2s, box-shadow .2s;
//         }
//         .type-card:hover { transform:translateX(4px); box-shadow:var(--shadow-md); }
//         .type-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
//         .type-name { font-size:14px; font-weight:600; color:var(--c-text); }
//         .type-tag { font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; }
//         .type-path { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
//         .path-step { display:flex; align-items:center; gap:6px; }
//         .step-pill {
//           font-size:11.5px; font-weight:500; padding:4px 10px; border-radius:6px;
//           background:var(--c-surface2); color:var(--c-text2);
//           transition: background .2s;
//         }
//         .path-arrow { color:var(--c-text3); flex-shrink:0; }

//         /* ─── FEATURES ───────────────────────────────────────────────── */
//         .features-section { padding:80px 24px; background:var(--c-bg); }
//         .features-grid {
//           display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
//         }
//         @media(max-width:960px){ .features-grid { grid-template-columns:repeat(2,1fr); } }
//         @media(max-width:560px){ .features-grid { grid-template-columns:1fr; } }
//         .feature-card {
//           background:var(--c-surface); border:1px solid var(--c-border);
//           border-radius:var(--radius); padding:28px 24px;
//           box-shadow:var(--shadow); position:relative; overflow:hidden;
//           transition: transform .2s, box-shadow .2s;
//         }
//         .feature-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); }
//         .feature-icon-box {
//           width:44px; height:44px; border-radius:10px;
//           background:var(--fbg, var(--c-primary-light));
//           display:flex; align-items:center; justify-content:center;
//           margin-bottom:18px;
//         }
//         .landing-root.dark .feature-icon-box { background: color-mix(in srgb, var(--fc, var(--c-primary)) 15%, transparent); }
//         .feature-title { font-size:15px; font-weight:700; color:var(--c-text); margin:0 0 10px; }
//         .feature-desc { font-size:13.5px; color:var(--c-text2); line-height:1.65; margin:0; }
//         .feature-line {
//           position:absolute; bottom:0; left:0; right:0; height:3px; opacity:.6;
//         }

//         /* ─── STEPS ──────────────────────────────────────────────────── */
//         .steps-section { padding:80px 24px; background:var(--c-surface2); }
//         .steps-layout {
//           display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:start;
//         }
//         @media(max-width:768px){ .steps-layout { grid-template-columns:1fr; } }
//         .steps-tabs { display:flex; flex-direction:column; gap:8px; }
//         .step-tab {
//           display:flex; align-items:center; gap:14px;
//           padding:14px 18px; border-radius:var(--radius);
//           background:var(--c-surface); border:1px solid var(--c-border);
//           cursor:pointer; text-align:left; transition: all .2s;
//         }
//         .step-tab:hover { border-color:var(--c-primary); }
//         .step-tab.active {
//           background:var(--c-primary-light); border-color:var(--c-primary);
//           box-shadow: 0 0 0 3px rgba(79,70,229,.1);
//         }
//         .landing-root.dark .step-tab.active { background:var(--c-primary-light); }
//         .step-num {
//           font-size:13px; font-weight:700; color:var(--c-text3);
//           font-family:var(--font-display); width:28px;
//           flex-shrink:0;
//         }
//         .step-tab.active .step-num { color:var(--c-primary); }
//         .step-tab-title { font-size:14px; font-weight:600; color:var(--c-text2); flex:1; }
//         .step-tab.active .step-tab-title { color:var(--c-primary); }
//         .step-chevron { color:var(--c-border); transition: color .2s; flex-shrink:0; }
//         .step-tab.active .step-chevron { color:var(--c-primary); }
//         .step-detail {
//           background:var(--c-surface); border:1px solid var(--c-border);
//           border-radius:16px; padding:40px; box-shadow:var(--shadow-md);
//           transition: all .35s ease; min-height:280px;
//         }
//         .step-detail-num {
//           font-size:48px; font-weight:800; color:var(--c-primary); opacity:.15;
//           font-family:var(--font-display); line-height:1; margin-bottom:16px;
//         }
//         .step-detail-title { font-size:22px; font-weight:700; color:var(--c-text); margin:0 0 12px; }
//         .step-detail-desc { font-size:15px; color:var(--c-text2); line-height:1.7; margin:0 0 24px; }
//         .step-detail-box {
//           background:var(--c-surface2); border-radius:10px;
//           padding:16px 20px; border:1px solid var(--c-border);
//         }
//         .step-detail-label {
//           font-size:11px; font-weight:700; text-transform:uppercase;
//           letter-spacing:.06em; color:var(--c-primary); display:block; margin-bottom:8px;
//         }
//         .step-detail-inner { font-size:13.5px; color:var(--c-text2); line-height:1.65; margin:0; }

//         /* ─── TESTIMONIALS ───────────────────────────────────────────── */
//         .testimonials-section { padding:80px 24px; background:var(--c-bg); }
//         .testimonials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
//         @media(max-width:768px){ .testimonials-grid { grid-template-columns:1fr; } }
//         .testimonial-card {
//           background:var(--c-surface); border:1px solid var(--c-border);
//           border-radius:var(--radius); padding:28px 24px;
//           box-shadow:var(--shadow); transition: transform .2s, box-shadow .2s;
//         }
//         .testimonial-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
//         .t-stars { display:flex; gap:3px; margin-bottom:16px; }
//         .t-text { font-size:14.5px; color:var(--c-text2); line-height:1.7; margin:0 0 20px; font-style:italic; }
//         .t-author { display:flex; align-items:center; gap:12px; }
//         .t-avatar {
//           width:38px; height:38px; border-radius:50%;
//           background:linear-gradient(135deg, var(--c-primary), #0891B2);
//           color:#fff; font-size:15px; font-weight:700;
//           display:flex; align-items:center; justify-content:center;
//           flex-shrink:0;
//         }
//         .t-name { font-size:13.5px; font-weight:700; color:var(--c-text); }
//         .t-role { font-size:12px; color:var(--c-text3); }

//         /* ─── CTA ────────────────────────────────────────────────────── */
//         .cta-section {
//           padding:80px 24px;
//           background:linear-gradient(135deg, var(--c-primary) 0%, #0891B2 100%);
//           text-align:center;
//         }
//         .cta-inner { max-width:560px; margin:0 auto; }
//         .cta-title { font-family:var(--font-display); font-size:clamp(24px,4vw,38px); font-weight:700; color:#fff; margin:0 0 14px; }
//         .cta-sub { font-size:16px; color:rgba(255,255,255,.8); margin:0 0 32px; line-height:1.6; }
//         .cta-btn { background:#fff; color:var(--c-primary); box-shadow:0 8px 24px rgba(0,0,0,.2); font-size:16px; padding:14px 28px; }
//         .cta-btn:hover { background:#F0F0FF; transform:translateY(-2px); }

//         /* ─── FOOTER ─────────────────────────────────────────────────── */
//         .footer { background:#09090B; padding:60px 24px 0; }
//         .footer-inner {
//           max-width:1200px; margin:0 auto;
//           display:grid; grid-template-columns:1.6fr 1fr; gap:48px;
//           padding-bottom:48px;
//           border-bottom:1px solid #27272A;
//         }
//         @media(max-width:768px){ .footer-inner { grid-template-columns:1fr; gap:32px; } }
//         .footer-desc { font-size:13.5px; color:#71717A; line-height:1.7; margin:0 0 20px; max-width:320px; }
//         .footer-socials { display:flex; gap:10px; }
//         .social-icon {
//           width:36px; height:36px; border-radius:8px;
//           background:#18181B; border:1px solid #27272A;
//           color:#71717A; display:flex; align-items:center; justify-content:center;
//           transition: background .15s, color .15s; text-decoration:none;
//         }
//         .social-icon:hover { background:#27272A; color:#fff; }
//         .footer-links-group { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
//         @media(max-width:480px){ .footer-links-group { grid-template-columns:1fr 1fr; } }
//         .footer-col { display:flex; flex-direction:column; gap:10px; }
//         .footer-col-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#52525B; margin-bottom:4px; }
//         .footer-link {
//           background:none; border:none; padding:0;
//           font-size:13.5px; color:#71717A; cursor:pointer;
//           text-align:left; transition:color .15s;
//         }
//         .footer-link:hover { color:#A1A1AA; }
//         .footer-bottom {
//           max-width:1200px; margin:0 auto;
//           padding:20px 0; display:flex; justify-content:space-between;
//           align-items:center; flex-wrap:wrap; gap:8px;
//           font-size:12.5px; color:#52525B;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default LandingPage; 













import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronRight, Menu, X, Sun, Moon,
  Users, BookOpen, TrendingUp, CheckCircle, Award,
  BarChart3, Shield, Clock, FileText, Star,
  Linkedin, Mail, Github, GraduationCap, Building2,
  MapPin, Zap, ChevronDown
} from 'lucide-react';

// ── Replace these with your actual logo URLs or import paths ──
const MITS_LOGO_URL = 'https://res.cloudinary.com/dz2nbphcx/image/upload/v1775629505/download_bjgr5f.png';
const SDC_LOGO_URL = 'https://res.cloudinary.com/dz2nbphcx/image/upload/v1775632413/download_azsode.jpg';

const LandingPage = ({ onNavigateToLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setDarkMode(saved === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      document.querySelectorAll('[data-animate]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) {
          el.classList.add('in-view');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    setTimeout(() => handleScroll(), 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const stats = [
    { value: '500+', label: 'Active Students', icon: Users },
    { value: '200+', label: 'Completed Projects', icon: CheckCircle },
    { value: '50+', label: 'Partner Companies', icon: Building2 },
    { value: '95%', label: 'Success Rate', icon: Award },
  ];

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      desc: 'Streamlined registration with secure authentication. Bulk upload via CSV/Excel, role-based access for admins, mentors and students.',
      color: '#4F46E5',
      bg: '#EEF2FF',
    },
    {
      icon: FileText,
      title: 'Internship Tracking',
      desc: 'Submit offer letters, NOC, stipend proofs. Track 6th, 7th, 8th semester internships and 8th semester projects separately.',
      color: '#0891B2',
      bg: '#ECFEFF',
    },
    {
      icon: BarChart3,
      title: 'Progress Monitoring',
      desc: 'MPR submissions (mpr1, mpr2, mpr3, midSem1) with mentor review workflows. Final report submission after all MPRs are approved.',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      icon: Shield,
      title: 'Mentor Review System',
      desc: 'Mentors can approve or reject registrations, MPR documents, and final reports. Email notifications at every stage.',
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      desc: 'Comprehensive insights — company-wise, location-wise, stipend distribution, domain breakdown, and monthly trends.',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    {
      icon: Zap,
      title: 'Admin Control Panel',
      desc: 'Full admin control: create/manage mentors, assign students, bulk upload, export Excel reports for all submission types.',
      color: '#E11D48',
      bg: '#FFF1F2',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Register & Login',
      desc: 'Students receive login credentials after admin bulk upload. Login with your enrollment number and college email.',
      detail: 'Admin bulk-uploads student data via CSV. System auto-assigns mentors based on capacity.',
    },
    {
      num: '02',
      title: 'Choose Semester Type',
      desc: 'Select from 6th Internship, 7th Internship, 8th Internship, 8th Project, or Any Other Internship.',
      detail: 'The system intelligently shows only eligible semester types based on your previous completions.',
    },
    {
      num: '03',
      title: 'Submit Registration',
      desc: 'Fill internship details — company, dates, mentor info, stipend. Upload offer letter, NOC, and stipend proof.',
      detail: 'Your assigned mentor reviews and approves or rejects with feedback via the dashboard.',
    },
    {
      num: '04',
      title: 'MPRs & Final Report',
      desc: 'For 7th/8th semester: Submit 4 MPR documents (MPR1, MPR2, MPR3, MidSem1). Then submit final report.',
      detail: 'All 4 MPRs must be approved by mentor before final report unlock. Completion marks the internship done.',
    },
  ];

  const internshipTypes = [
    { type: '6th Semester Internship', path: 'Direct → Registration → Final Report', color: '#4F46E5', tag: '2 Steps' },
    { type: '7th Semester Internship', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#0891B2', tag: '6 Steps' },
    { type: '8th Semester Internship', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#059669', tag: '6 Steps' },
    { type: '8th Semester Project', path: 'Registration → MPR1 → MPR2 → MPR3 → MidSem1 → Final Report', color: '#7C3AED', tag: '6 Steps' },
    { type: 'Any Other Internship', path: 'Direct → Registration → Final Report', color: '#D97706', tag: '2 Steps' },
  ];

  const testimonials = [
    { name: 'Rahul Sharma', role: 'CSE Student, 2024', text: 'The MPR tracking system is so organized. My mentor reviewed everything within a day and gave clear feedback.', rating: 5 },
    { name: 'Prof. Meena Tiwari', role: 'Mentor, MITS Gwalior', text: 'Managing 20+ students is now effortless. I can see all pending reviews in one place and approve with one click.', rating: 5 },
    { name: 'Dr. Anil Verma', role: 'Coordinator, IoT Dept.', text: 'The analytics dashboard gives us real-time insights into placement rates and company distributions.', rating: 5 },
  ];

  return (
    <div className={`landing-root ${darkMode ? 'dark' : 'light'}`}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`nav-bar ${isScrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon">
              <GraduationCap size={20} color="#fff" />
            </div>
            <span className="brand-name">IPMS</span>
          </div>

          <div className="nav-links desktop-only">
            {['home', 'features', 'how-it-works', 'testimonials'].map(id => (
              <button key={id} className="nav-link" onClick={() => scrollTo(id)}>
                {id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
            <button className="nav-link" onClick={() => navigate('/analytics')}>
              <BarChart3 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Analytics
            </button>
            <button className="nav-link" onClick={() => navigate('/developer')}>Developer</button>
          </div>

          <div className="nav-actions">
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="btn-login" onClick={onNavigateToLogin}>
              Login <ChevronRight size={15} />
            </button>
            <button className="icon-btn mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            {['home', 'features', 'how-it-works', 'testimonials'].map(id => (
              <button key={id} className="mobile-link" onClick={() => scrollTo(id)}>
                {id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
            <button className="mobile-link" onClick={() => { navigate('/analytics'); setIsMenuOpen(false); }}>Analytics</button>
            <button className="mobile-link" onClick={() => { navigate('/developer'); setIsMenuOpen(false); }}>Developer</button>
            <button className="mobile-link accent" onClick={onNavigateToLogin}>Login →</button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="home" className="hero-section" ref={heroRef}>
        <div className="hero-bg-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="hero-inner">
          <div className="hero-badge" data-animate>
            <span className="badge-dot" />
            Madhav Institute of Technology &amp; Science — DU Gwalior
          </div>

          <h1 className="hero-title" data-animate>
            Internship &amp; Project<br />
            <span className="hero-gradient">Management Platform</span>
          </h1>

          <p className="hero-sub" data-animate>
            The official platform for MITS students to register, track, and complete
            internships. Mentors review submissions. Admins manage everything.
            From 6th semester to final report — all in one place.
          </p>

          <div className="hero-cta" data-animate>
            <button className="btn-primary" onClick={onNavigateToLogin}>
              Get Started <ArrowRight size={17} />
            </button>
            <button className="btn-outline" onClick={() => scrollTo('how-it-works')}>
              How it works <ChevronDown size={17} />
            </button>
          </div>

          <div className="stats-row" data-animate>
            {stats.map(({ value, label, icon: Icon }, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-icon-wrap">
                  <Icon size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERNSHIP TYPES ────────────────────────────────────────────── */}
      <section className="types-section">
        <div className="section-inner">
          <div className="section-header" data-animate>
            <span className="section-tag">Semester Workflows</span>
            <h2 className="section-title">5 Internship &amp; Project Types</h2>
            <p className="section-sub">Each type has its own submission workflow. The platform guides you step by step.</p>
          </div>
          <div className="types-grid" data-animate>
            {internshipTypes.map(({ type, path, color, tag }, i) => (
              <div className="type-card" key={i} style={{ '--accent': color }}>
                <div className="type-header">
                  <span className="type-name">{type}</span>
                  <span className="type-tag" style={{ background: color + '18', color }}>{tag}</span>
                </div>
                <div className="type-path">
                  {path.split(' → ').map((step, j) => (
                    <span key={j} className="path-step">
                      <span className="step-pill" style={j === 0 ? { background: color, color: '#fff' } : {}}>{step}</span>
                      {j < path.split(' → ').length - 1 && <ChevronRight size={12} className="path-arrow" />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="section-inner">
          <div className="section-header" data-animate>
            <span className="section-tag">Platform Features</span>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-sub">Built for students, mentors, and administrators of MITS Gwalior.</p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div className="feature-card" key={i} data-animate style={{ '--fc': color, '--fbg': bg }}>
                <div className="feature-icon-box">
                  <Icon size={22} color={color} />
                </div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
                <div className="feature-line" style={{ background: color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="steps-section">
        <div className="section-inner">
          <div className="section-header" data-animate>
            <span className="section-tag">Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-sub">Four clear stages from login to completion.</p>
          </div>

          <div className="steps-layout" data-animate>
            <div className="steps-tabs">
              {steps.map((s, i) => (
                <button
                  key={i}
                  className={`step-tab ${activeStep === i ? 'active' : ''}`}
                  onClick={() => setActiveStep(i)}
                >
                  <span className="step-num">{s.num}</span>
                  <span className="step-tab-title">{s.title}</span>
                  <ChevronRight size={16} className="step-chevron" />
                </button>
              ))}
            </div>

            <div className="step-detail">
              <div className="step-detail-num">{steps[activeStep].num}</div>
              <h3 className="step-detail-title">{steps[activeStep].title}</h3>
              <p className="step-detail-desc">{steps[activeStep].desc}</p>
              <div className="step-detail-box">
                <span className="step-detail-label">Behind the scenes</span>
                <p className="step-detail-inner">{steps[activeStep].detail}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-inner">
          <div className="section-header" data-animate>
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">What People Say</h2>
          </div>
          <div className="testimonials-grid" data-animate>
            {testimonials.map(({ name, role, text, rating }, i) => (
              <div className="testimonial-card" key={i}>
                <div className="t-stars">
                  {[...Array(rating)].map((_, j) => (
                    <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="t-text">"{text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{name[0]}</div>
                  <div>
                    <div className="t-name">{name}</div>
                    <div className="t-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-inner" data-animate>
          <h2 className="cta-title">Ready to Track Your Internship?</h2>
          <p className="cta-sub">Login with your MITS credentials and start your internship journey today.</p>
          <button className="btn-primary cta-btn" onClick={onNavigateToLogin}>
            Login to IPMS <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="footer">

        {/* Rainbow top border */}
        <div className="footer-rainbow" />

        {/* Main 3-column grid */}
        <div className="footer-main">

          {/* Col 1 — Our Partners */}
          <div className="footer-col-section">
            <h4 className="footer-col-heading">For</h4>
            <div className="footer-underline" />
            <div className="footer-logos">
              <img
                src={MITS_LOGO_URL}
                alt="MITS Logo"
                className="footer-partner-logo"
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* <img
                src={SDC_LOGO_URL}
                alt="SDC Logo"
                className="footer-partner-logo"
                onError={e => { e.target.style.display = 'none'; }}
              /> */}
            </div>
            <p className="footer-partner-caption">
              Madhav Institute of Technology &amp; Science — Deemed University, Gwalior
            </p>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="footer-col-section">
            <h4 className="footer-col-heading">Quick Links</h4>
            <div className="footer-underline" />
            <div className="footer-links-grid">
              <div className="footer-links-col">
                <button className="footer-qlink" onClick={() => scrollTo('home')}>
                  <ChevronRight size={13} /> Home
                </button>
                <button className="footer-qlink" onClick={() => scrollTo('features')}>
                  <ChevronRight size={13} /> Features
                </button>
                <button className="footer-qlink" onClick={() => scrollTo('how-it-works')}>
                  <ChevronRight size={13} /> How It Works
                </button>
              </div>
              <div className="footer-links-col">
                <button className="footer-qlink" onClick={() => scrollTo('testimonials')}>
                  <ChevronRight size={13} /> Testimonials
                </button>
                <button className="footer-qlink" onClick={() => navigate('/analytics')}>
                  <ChevronRight size={13} /> Analytics
                </button>
                <button className="footer-qlink" onClick={onNavigateToLogin}>
                  <ChevronRight size={13} /> Login
                </button>
              </div>
            </div>
          </div>

          {/* Col 3 — Contact Us */}
          <div className="footer-col-section">
            <h4 className="footer-col-heading">Contact Us</h4>
            <div className="footer-underline" />
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <Mail size={15} className="footer-contact-icon" />
                <span>ipmsk@mitsgwalior.in</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-emoji">📱</span>
                <span>+91 7275765537 (WhatsApp Only)</span>
              </div>
              <div className="footer-contact-item footer-contact-address">
                <MapPin size={15} className="footer-contact-icon footer-contact-icon-top" />
                <span>
                  Madhav Institute of Technology &amp; Science,<br />
                  Deemed University,<br />
                  Gola ka Mandir, Gwalior — 474005,<br />
                  Madhya Pradesh, India
                </span>
              </div>
              <a
                href="https://maps.google.com/?q=Madhav+Institute+of+Technology+and+Science+Gwalior"
                target="_blank"
                rel="noreferrer"
                className="footer-map-btn"
              >
                View in Map
              </a>
            </div>
          </div>
        </div>

        {/* Horizontal divider */}
        <div className="footer-full-divider" />

        {/* Social icons row */}
        <div className="footer-socials-row">
          <a href="https://www.facebook.com/MitsMadhavIstituteOfTechnologyScienceGwalior/" target="_blank" rel="noreferrer" className="footer-social-circle" aria-label="Facebook">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/mits_gwalior/" target="_blank" rel="noreferrer" className="footer-social-circle" aria-label="Instagram">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href="https://in.linkedin.com/school/mitsdugwalior/" target="_blank" rel="noreferrer" className="footer-social-circle" aria-label="LinkedIn">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
        </div>

        {/* Bottom copyright strip */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} IPMS | Design and Develop by SDC MITS-DU Gwalior | All Rights Reserved</span>
        </div>

        {/* SDC Logo watermark */}
        {/* SDC Logo watermark */}

        <a href="https://sdc.mitsgwalior.in"
          target="_blank"
          rel="noreferrer"
          className="footer-watermark"
          style={{ textDecoration: 'none' }}
        >
          <img
            src={SDC_LOGO_URL}
            alt="SDC Logo"
            className="footer-watermark-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span>Software Development Club — MITS DU</span>
        </a>

      </footer>

      <style>{`
        /* ─── TOKENS ──────────────────────────────────────────────────── */
        .landing-root {
          --c-bg: #FAFAFA;
          --c-surface: #FFFFFF;
          --c-surface2: #F4F4F5;
          --c-border: #E4E4E7;
          --c-text: #09090B;
          --c-text2: #52525B;
          --c-text3: #A1A1AA;
          --c-primary: #4F46E5;
          --c-primary-light: #EEF2FF;
          --c-primary-dark: #3730A3;
          --font-display: 'Georgia', 'Times New Roman', serif;
          --font-body: -apple-system, 'Segoe UI', sans-serif;
          --radius: 12px;
          --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06);
          --nav-h: 64px;
          background: var(--c-bg);
          color: var(--c-text);
          font-family: var(--font-body);
          min-height: 100vh;
          overflow-x: hidden;
        }
        .landing-root.dark {
          --c-bg: #09090B;
          --c-surface: #18181B;
          --c-surface2: #27272A;
          --c-border: #3F3F46;
          --c-text: #FAFAFA;
          --c-text2: #A1A1AA;
          --c-text3: #71717A;
          --c-primary-light: #1E1B4B;
          --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.3);
        }

        /* ─── SCROLL ANIMATIONS ──────────────────────────────────────── */
        [data-animate] { opacity:0; transform:translateY(28px); transition: opacity .6s ease, transform .6s ease; }
        [data-animate].in-view { opacity:1; transform:translateY(0); }

        /* ─── NAV ────────────────────────────────────────────────────── */
        .nav-bar {
          position: fixed; top:0; left:0; right:0; z-index:100;
          transition: background .3s, box-shadow .3s, border-color .3s;
          border-bottom: 1px solid transparent;
        }
        .nav-scrolled {
          background: var(--c-surface);
          border-bottom-color: var(--c-border);
          box-shadow: 0 1px 16px rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1200px; margin:0 auto; padding:0 24px;
          height: var(--nav-h); display:flex; align-items:center;
          justify-content: space-between; gap:24px;
        }
        .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .brand-icon {
          width:32px; height:32px; background:var(--c-primary);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .brand-name { font-size:17px; font-weight:700; color:var(--c-text); letter-spacing:-.3px; }
        .nav-links { display:flex; align-items:center; gap:4px; }
        .nav-link {
          background:none; border:none; padding:7px 13px; border-radius:8px;
          font-size:13.5px; font-weight:500; color:var(--c-text2); cursor:pointer;
          transition: background .15s, color .15s; white-space:nowrap;
          display:flex; align-items:center;
        }
        .nav-link:hover { background:var(--c-surface2); color:var(--c-text); }
        .nav-actions { display:flex; align-items:center; gap:8px; }
        .icon-btn {
          width:36px; height:36px; border-radius:8px; border:1px solid var(--c-border);
          background:var(--c-surface); color:var(--c-text2); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition: background .15s, color .15s;
        }
        .icon-btn:hover { background:var(--c-surface2); color:var(--c-text); }
        .btn-login {
          display:flex; align-items:center; gap:4px;
          padding:8px 18px; border-radius:8px;
          background:var(--c-primary); color:#fff; border:none;
          font-size:13.5px; font-weight:600; cursor:pointer;
          transition: background .15s, transform .1s;
        }
        .btn-login:hover { background:var(--c-primary-dark); transform:translateY(-1px); }
        .desktop-only { display:flex; }
        .mobile-only { display:none; }
        @media(max-width:768px){
          .desktop-only { display:none; }
          .mobile-only { display:flex; }
        }
        .mobile-menu {
          background:var(--c-surface); border-top:1px solid var(--c-border);
          padding:16px 24px 20px; display:flex; flex-direction:column; gap:2px;
        }
        .mobile-link {
          background:none; border:none; padding:10px 12px; border-radius:8px;
          font-size:14px; font-weight:500; color:var(--c-text2); cursor:pointer;
          text-align:left; transition: background .15s, color .15s;
        }
        .mobile-link:hover { background:var(--c-surface2); color:var(--c-text); }
        .mobile-link.accent { color:var(--c-primary); font-weight:600; margin-top:8px; }

        /* ─── HERO ───────────────────────────────────────────────────── */
        .hero-section {
          position:relative; min-height:100vh;
          display:flex; align-items:center; justify-content:center;
          padding: calc(var(--nav-h) + 60px) 24px 80px;
          overflow:hidden;
        }
        .hero-bg-grid {
          position:absolute; inset:0; opacity:.4;
          background-image: linear-gradient(var(--c-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
          background-size:48px 48px;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
          pointer-events:none;
        }
        .hero-orb {
          position:absolute; border-radius:50%;
          filter:blur(80px); pointer-events:none; opacity:.25;
        }
        .hero-orb-1 {
          width:480px; height:480px;
          background:radial-gradient(circle, #818CF8 0%, #4F46E5 100%);
          top:-120px; right:-100px;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width:320px; height:320px;
          background:radial-gradient(circle, #67E8F9 0%, #0891B2 100%);
          bottom:-60px; left:-60px;
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        @keyframes orbFloat {
          0%,100% { transform:translateY(0) scale(1); }
          50% { transform:translateY(-24px) scale(1.04); }
        }
        .hero-inner {
          position:relative; text-align:center;
          max-width:800px; margin:0 auto; z-index:1;
        }
        .hero-badge {
          display:inline-flex; align-items:center; gap:8px;
          padding:7px 16px; border-radius:999px;
          background:var(--c-primary-light); border:1px solid #C7D2FE;
          font-size:12.5px; font-weight:500; color:var(--c-primary);
          margin-bottom:28px; letter-spacing:.01em;
        }
        .landing-root.dark .hero-badge { border-color:#3730A3; }
        .badge-dot {
          width:7px; height:7px; border-radius:50%;
          background:var(--c-primary); animation:pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity:1; } 50% { opacity:.4; }
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(36px, 6vw, 64px);
          font-weight:700; line-height:1.12;
          color:var(--c-text); margin:0 0 24px;
          letter-spacing:-.02em;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #4F46E5 0%, #0891B2 50%, #059669 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-sub {
          font-size:17px; color:var(--c-text2); max-width:560px;
          margin:0 auto 36px; line-height:1.7;
        }
        .hero-cta { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:64px; }
        .btn-primary {
          display:inline-flex; align-items:center; gap:7px;
          padding:12px 24px; border-radius:10px;
          background:var(--c-primary); color:#fff; border:none;
          font-size:15px; font-weight:600; cursor:pointer;
          transition: background .15s, transform .15s, box-shadow .15s;
          box-shadow: 0 4px 14px rgba(79,70,229,.35);
        }
        .btn-primary:hover { background:var(--c-primary-dark); transform:translateY(-2px); box-shadow:0 6px 20px rgba(79,70,229,.45); }
        .btn-outline {
          display:inline-flex; align-items:center; gap:7px;
          padding:12px 24px; border-radius:10px;
          background:var(--c-surface); color:var(--c-text2);
          border:1px solid var(--c-border);
          font-size:15px; font-weight:600; cursor:pointer;
          transition: background .15s, transform .15s;
        }
        .btn-outline:hover { background:var(--c-surface2); transform:translateY(-2px); }
        .stats-row {
          display:grid; grid-template-columns:repeat(4,1fr); gap:16px;
        }
        @media(max-width:640px){ .stats-row { grid-template-columns:repeat(2,1fr); } }
        .stat-card {
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:var(--radius); padding:20px 16px;
          text-align:center; box-shadow:var(--shadow);
          transition: transform .2s, box-shadow .2s;
        }
        .stat-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
        .stat-icon-wrap {
          width:36px; height:36px; border-radius:8px;
          background:var(--c-primary-light); display:flex;
          align-items:center; justify-content:center; margin:0 auto 10px;
        }
        .stat-icon { color:var(--c-primary); }
        .stat-value { font-size:24px; font-weight:800; color:var(--c-text); margin-bottom:4px; }
        .stat-label { font-size:12px; color:var(--c-text3); font-weight:500; }

        /* ─── TYPES ──────────────────────────────────────────────────── */
        .types-section { padding:80px 24px; background:var(--c-surface2); }
        .section-inner { max-width:1200px; margin:0 auto; }
        .section-header { text-align:center; margin-bottom:52px; }
        .section-tag {
          display:inline-block; padding:5px 14px; border-radius:999px;
          background:var(--c-primary-light); color:var(--c-primary);
          font-size:12px; font-weight:600; letter-spacing:.06em;
          text-transform:uppercase; margin-bottom:14px;
        }
        .section-title {
          font-family:var(--font-display);
          font-size:clamp(26px,4vw,40px); font-weight:700;
          color:var(--c-text); margin:0 0 14px; letter-spacing:-.02em;
        }
        .section-sub { font-size:15.5px; color:var(--c-text2); max-width:480px; margin:0 auto; line-height:1.6; }
        .types-grid { display:flex; flex-direction:column; gap:12px; }
        .type-card {
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:var(--radius); padding:18px 22px;
          box-shadow:var(--shadow);
          border-left:3px solid var(--accent, var(--c-primary));
          transition: transform .2s, box-shadow .2s;
        }
        .type-card:hover { transform:translateX(4px); box-shadow:var(--shadow-md); }
        .type-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .type-name { font-size:14px; font-weight:600; color:var(--c-text); }
        .type-tag { font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; }
        .type-path { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
        .path-step { display:flex; align-items:center; gap:6px; }
        .step-pill {
          font-size:11.5px; font-weight:500; padding:4px 10px; border-radius:6px;
          background:var(--c-surface2); color:var(--c-text2);
          transition: background .2s;
        }
        .path-arrow { color:var(--c-text3); flex-shrink:0; }

        /* ─── FEATURES ───────────────────────────────────────────────── */
        .features-section { padding:80px 24px; background:var(--c-bg); }
        .features-grid {
          display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
        }
        @media(max-width:960px){ .features-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:560px){ .features-grid { grid-template-columns:1fr; } }
        .feature-card {
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:var(--radius); padding:28px 24px;
          box-shadow:var(--shadow); position:relative; overflow:hidden;
          transition: transform .2s, box-shadow .2s;
        }
        .feature-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); }
        .feature-icon-box {
          width:44px; height:44px; border-radius:10px;
          background:var(--fbg, var(--c-primary-light));
          display:flex; align-items:center; justify-content:center;
          margin-bottom:18px;
        }
        .landing-root.dark .feature-icon-box { background: color-mix(in srgb, var(--fc, var(--c-primary)) 15%, transparent); }
        .feature-title { font-size:15px; font-weight:700; color:var(--c-text); margin:0 0 10px; }
        .feature-desc { font-size:13.5px; color:var(--c-text2); line-height:1.65; margin:0; }
        .feature-line {
          position:absolute; bottom:0; left:0; right:0; height:3px; opacity:.6;
        }

        /* ─── STEPS ──────────────────────────────────────────────────── */
        .steps-section { padding:80px 24px; background:var(--c-surface2); }
        .steps-layout {
          display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:start;
        }
        @media(max-width:768px){ .steps-layout { grid-template-columns:1fr; } }
        .steps-tabs { display:flex; flex-direction:column; gap:8px; }
        .step-tab {
          display:flex; align-items:center; gap:14px;
          padding:14px 18px; border-radius:var(--radius);
          background:var(--c-surface); border:1px solid var(--c-border);
          cursor:pointer; text-align:left; transition: all .2s;
        }
        .step-tab:hover { border-color:var(--c-primary); }
        .step-tab.active {
          background:var(--c-primary-light); border-color:var(--c-primary);
          box-shadow: 0 0 0 3px rgba(79,70,229,.1);
        }
        .landing-root.dark .step-tab.active { background:var(--c-primary-light); }
        .step-num {
          font-size:13px; font-weight:700; color:var(--c-text3);
          font-family:var(--font-display); width:28px; flex-shrink:0;
        }
        .step-tab.active .step-num { color:var(--c-primary); }
        .step-tab-title { font-size:14px; font-weight:600; color:var(--c-text2); flex:1; }
        .step-tab.active .step-tab-title { color:var(--c-primary); }
        .step-chevron { color:var(--c-border); transition: color .2s; flex-shrink:0; }
        .step-tab.active .step-chevron { color:var(--c-primary); }
        .step-detail {
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:16px; padding:40px; box-shadow:var(--shadow-md);
          transition: all .35s ease; min-height:280px;
        }
        .step-detail-num {
          font-size:48px; font-weight:800; color:var(--c-primary); opacity:.15;
          font-family:var(--font-display); line-height:1; margin-bottom:16px;
        }
        .step-detail-title { font-size:22px; font-weight:700; color:var(--c-text); margin:0 0 12px; }
        .step-detail-desc { font-size:15px; color:var(--c-text2); line-height:1.7; margin:0 0 24px; }
        .step-detail-box {
          background:var(--c-surface2); border-radius:10px;
          padding:16px 20px; border:1px solid var(--c-border);
        }
        .step-detail-label {
          font-size:11px; font-weight:700; text-transform:uppercase;
          letter-spacing:.06em; color:var(--c-primary); display:block; margin-bottom:8px;
        }
        .step-detail-inner { font-size:13.5px; color:var(--c-text2); line-height:1.65; margin:0; }

        /* ─── TESTIMONIALS ───────────────────────────────────────────── */
        .testimonials-section { padding:80px 24px; background:var(--c-bg); }
        .testimonials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media(max-width:768px){ .testimonials-grid { grid-template-columns:1fr; } }
        .testimonial-card {
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:var(--radius); padding:28px 24px;
          box-shadow:var(--shadow); transition: transform .2s, box-shadow .2s;
        }
        .testimonial-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
        .t-stars { display:flex; gap:3px; margin-bottom:16px; }
        .t-text { font-size:14.5px; color:var(--c-text2); line-height:1.7; margin:0 0 20px; font-style:italic; }
        .t-author { display:flex; align-items:center; gap:12px; }
        .t-avatar {
          width:38px; height:38px; border-radius:50%;
          background:linear-gradient(135deg, var(--c-primary), #0891B2);
          color:#fff; font-size:15px; font-weight:700;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .t-name { font-size:13.5px; font-weight:700; color:var(--c-text); }
        .t-role { font-size:12px; color:var(--c-text3); }

        /* ─── CTA ────────────────────────────────────────────────────── */
        .cta-section {
          padding:80px 24px;
          background:linear-gradient(135deg, var(--c-primary) 0%, #0891B2 100%);
          text-align:center;
        }
        .cta-inner { max-width:560px; margin:0 auto; }
        .cta-title { font-family:var(--font-display); font-size:clamp(24px,4vw,38px); font-weight:700; color:#fff; margin:0 0 14px; }
        .cta-sub { font-size:16px; color:rgba(255,255,255,.8); margin:0 0 32px; line-height:1.6; }
        .cta-btn { background:#fff; color:var(--c-primary); box-shadow:0 8px 24px rgba(0,0,0,.2); font-size:16px; padding:14px 28px; }
        .cta-btn:hover { background:#F0F0FF; transform:translateY(-2px); }

        /* ─── FOOTER ─────────────────────────────────────────────────── */
        .footer {
          background: #0D1117;
          color: #C9D1D9;
          font-family: var(--font-body);
        }

        /* Rainbow top border — same as in your reference image */
        .footer-rainbow {
          height: 4px;
          background: linear-gradient(90deg, #4F46E5 0%, #0891B2 25%, #059669 50%, #D97706 75%, #E11D48 100%);
        }

        /* 3-column main grid */
        .footer-main {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.3fr 1.5fr;
          gap: 52px;
          padding: 52px 24px 44px;
        }
        @media(max-width: 900px) {
          .footer-main { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media(max-width: 560px) {
          .footer-main { grid-template-columns: 1fr; gap: 32px; }
        }

        .footer-col-section {
          display: flex;
          flex-direction: column;
        }

        /* Column heading — bold white, like "Our Partners" in the image */
        .footer-col-heading {
          font-size: 15px;
          font-weight: 700;
          color: #F0F6FC;
          margin: 0 0 10px;
          letter-spacing: .01em;
        }

        /* Blue underline under each heading */
        .footer-underline {
          width: 38px;
          height: 3px;
          background: #4F46E5;
          border-radius: 2px;
          margin-bottom: 24px;
        }

        /* Partner logos row */
        .footer-logos {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .footer-partner-logo {
          height: 56px;
          width: 56px;
          object-fit: contain;
          border-radius: 50%;
          background: #161B22;
          border: 1px solid #30363D;
          padding: 5px;
        }
        .footer-partner-caption {
          font-size: 12px;
          color: #484F58;
          line-height: 1.6;
          margin: 0;
          max-width: 200px;
        }

        /* Quick Links two-column grid */
        .footer-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 12px;
        }
        .footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .footer-qlink {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          padding: 6px 0;
          font-size: 13.5px;
          color: #8B949E;
          cursor: pointer;
          text-align: left;
          transition: color .15s;
        }
        .footer-qlink:hover { color: #F0F6FC; }
        .footer-qlink svg { color: #4F46E5; flex-shrink: 0; }

        /* Contact Us list */
        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #8B949E;
          line-height: 1.6;
        }
        .footer-contact-address {
          align-items: flex-start;
        }
        .footer-contact-icon {
          color: #4F46E5;
          flex-shrink: 0;
        }
        .footer-contact-icon-top {
          margin-top: 3px;
        }
        .footer-contact-emoji {
          font-size: 15px;
          flex-shrink: 0;
          line-height: 1;
        }

        /* View in Map button */
        .footer-map-btn {
          display: inline-block;
          margin-top: 4px;
          padding: 9px 22px;
          border-radius: 6px;
          background: #4F46E5;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          width: fit-content;
          transition: background .15s, transform .1s;
        }
        .footer-map-btn:hover {
          background: #3730A3;
          transform: translateY(-1px);
        }

        /* Horizontal divider */
        .footer-full-divider {
          border: none;
          border-top: 1px solid #21262D;
          margin: 0 24px;
        }

        /* Social icons centered row */
        .footer-socials-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 24px 24px 20px;
        }
        .footer-social-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #161B22;
          border: 1px solid #30363D;
          color: #8B949E;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background .15s, color .15s, border-color .15s;
        }
        .footer-social-circle:hover {
          background: #4F46E5;
          color: #fff;
          border-color: #4F46E5;
        }

        /* Copyright strip */
        .footer-bottom {
          text-align: center;
          padding: 16px 24px;
          font-size: 12.5px;
          color: #484F58;
          border-top: 1px solid #21262D;
        }

        /* SDC watermark at very bottom */
        .footer-watermark {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 24px 20px;
        }
        .footer-watermark-logo {
          height: 28px;
          width: 28px;
          object-fit: contain;
          border-radius: 50%;
          opacity: .65;
        }
        .footer-watermark span {
          font-size: 12px;
          color: #30363D;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;