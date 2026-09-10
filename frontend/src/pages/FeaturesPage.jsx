import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sun, Moon, Users, FileText, BarChart3,
  Shield, Zap, CheckCircle, Clock, Upload, Bell,
  ChevronRight, ArrowRight, Download, Search,
  BookOpen, Award, TrendingUp, GraduationCap, Lock, Mail
} from 'lucide-react';

const FeaturesPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('student');

  useEffect(() => {
    const s = localStorage.getItem('theme');
    if (s) setDarkMode(s === 'dark');
  }, []);
  useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); }, [darkMode]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const roles = {
    student: {
      label: 'Student',
      color: '#4F46E5',
      icon: GraduationCap,
      features: [
        { icon: BookOpen, title: 'Choose Semester Type', desc: 'Select from 6th, 7th, 8th internship or 8th project. System shows only eligible types based on your history.' },
        { icon: FileText, title: 'Registration Form', desc: 'Submit company name, dates, mentor details, stipend info. Upload offer letter, NOC, and stipend proof documents.' },
        { icon: Upload, title: 'MPR Submissions', desc: 'Submit MPR1, MPR2, MPR3, and MidSem1 documents. Each gets individually reviewed and approved by your mentor.' },
        { icon: Award, title: 'Final Report', desc: 'After all MPRs are approved, unlock the final report submission. Complete your internship officially.' },
        { icon: TrendingUp, title: 'Progress View', desc: 'See your current step, submission status, mentor feedback, and history of all past internships.' },
        { icon: Bell, title: 'Email Notifications', desc: 'Get notified instantly when your registration, MPR, or final report is approved or rejected.' },
      ]
    },
    mentor: {
      label: 'Mentor',
      color: '#059669',
      icon: Shield,
      features: [
        { icon: Users, title: 'Assigned Students', desc: 'See all students assigned to you. Search, filter by name or enrollment number. Up to 20 students per mentor.' },
        { icon: CheckCircle, title: 'Review Registrations', desc: 'Approve or reject internship registrations. Provide detailed feedback on rejection for student to resubmit.' },
        { icon: FileText, title: 'MPR Review', desc: 'Review each MPR document submitted. Approve or reject individually. All 4 must be approved for final report.' },
        { icon: Award, title: 'Final Report Review', desc: 'Review and approve final reports to mark internship as completed. Full submission history accessible.' },
        { icon: BarChart3, title: 'Dashboard Overview', desc: 'See pending reviews, total students, approved/rejected counts, and recent submission activity.' },
        { icon: Download, title: 'Export Data', desc: 'Export your assigned students data as Excel spreadsheet for offline record-keeping.' },
      ]
    },
    admin: {
      label: 'Admin',
      color: '#D97706',
      icon: Lock,
      features: [
        { icon: Upload, title: 'Bulk Student Upload', desc: 'Upload CSV or Excel file to create hundreds of student accounts at once. Auto-assign mentors by capacity.' },
        { icon: Users, title: 'Mentor Management', desc: 'Create, update, and delete mentor accounts. Set max student capacity. Reassign students when deleting a mentor.' },
        { icon: Search, title: 'Student Management', desc: 'View, edit, delete all students. Filter by branch, mentor, status, or submission type. Bulk delete options.' },
        { icon: BarChart3, title: 'System Overview', desc: 'Full platform statistics — total users, pending reviews, placement rates, semester-wise breakdowns.' },
        { icon: Download, title: 'Data Export', desc: 'Export all student data, submission summaries, MPR details, and placement stats as Excel files.' },
        { icon: Shield, title: 'Access Control', desc: 'Role-based authentication. JWT tokens with 7-day expiry. Admin credentials secured via environment variables.' },
      ]
    }
  };

  const internshipWorkflows = [
    {
      type: '6th Semester Internship',
      color: '#4F46E5',
      bg: '#EEF2FF',
      steps: ['Login', 'Choose Type', 'Submit Registration', 'Mentor Reviews', 'Approved', 'Submit Final Report', 'Mentor Reviews', 'Completed ✓'],
      note: 'Straightforward 2-stage workflow. No MPRs required.'
    },
    {
      type: '7th Semester Internship',
      color: '#0891B2',
      bg: '#ECFEFF',
      steps: ['Login', 'Choose Type', 'Submit Registration', 'Approved', 'Submit MPR1', 'Submit MPR2', 'Submit MPR3', 'Submit MidSem1', 'All Approved', 'Final Report', 'Completed ✓'],
      note: 'All 4 MPR documents must be approved before final report unlocks.'
    },
    {
      type: '8th Semester Internship',
      color: '#059669',
      bg: '#ECFDF5',
      steps: ['Login', 'Choose Type', 'Submit Registration', 'Approved', 'Submit MPR1', 'Submit MPR2', 'Submit MPR3', 'Submit MidSem1', 'All Approved', 'Final Report', 'Completed ✓'],
      note: 'Same as 7th sem internship — full MPR workflow required.'
    },
    {
      type: '8th Semester Project',
      color: '#7C3AED',
      bg: '#F5F3FF',
      steps: ['Login', 'Choose Type', 'Submit Project Title & Type', 'Mentor Reviews', 'Approved', 'Submit MPR1–MidSem1', 'All Approved', 'Final Report', 'Completed ✓'],
      note: 'Project registration includes project title and type (instead of internship company details).'
    },
    {
      type: 'Any Other Internship',
      color: '#D97706',
      bg: '#FFFBEB',
      steps: ['Login', 'Choose Type', 'Submit Registration', 'Mentor Reviews', 'Approved', 'Submit Final Report', 'Completed ✓'],
      note: 'For internships not covered by standard semesters. Simple 2-stage flow.'
    },
  ];

  const techStack = [
    { name: 'React + Vite', role: 'Frontend', color: '#61DAFB', icon: '⚛️' },
    { name: 'Node.js + Express', role: 'Backend API', color: '#68A063', icon: '🟢' },
    { name: 'MongoDB', role: 'Database', color: '#47A248', icon: '🍃' },
    { name: 'JWT Auth', role: 'Security', color: '#D97706', icon: '🔐' },
    { name: 'Tailwind CSS', role: 'Styling', color: '#38BDF8', icon: '🎨' },
    { name: 'Nodemailer', role: 'Email Service', color: '#EA4335', icon: '📧' },
    { name: 'Multer', role: 'File Uploads', color: '#7C3AED', icon: '📎' },
    { name: 'ExcelJS', role: 'Data Export', color: '#217346', icon: '📊' },
  ];

  return (
    <div className={`feat-root ${darkMode ? 'dark' : ''}`}>

      {/* Nav */}
      <nav className="feat-nav">
        <div className="feat-nav-inner">
          <button className="feat-back" onClick={() => navigate('/')}>
            <ArrowLeft size={16}/> Back
          </button>
          <div className="feat-nav-brand">
            <div className="feat-brand-icon"><GraduationCap size={17} color="#fff"/></div>
            <span>InternTrack</span>
          </div>
          <button className="feat-theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={17}/> : <Moon size={17}/>}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="feat-hero">
        <div className="feat-hero-inner">
          <span className="feat-tag" data-animate>Platform Features</span>
          <h1 className="feat-h1" data-animate>
            Built for <span className="feat-accent">MITS Gwalior</span><br/>
            Internship Management
          </h1>
          <p className="feat-hero-sub" data-animate>
            Explore every feature — from student registration to mentor review, admin control, and analytics.
            Every role has its own dedicated workflow.
          </p>
        </div>
      </section>

      {/* Role tabs */}
      <section className="feat-section">
        <div className="feat-inner">
          <div className="feat-section-hd" data-animate>
            <span className="feat-tag">Role-Based Features</span>
            <h2 className="feat-h2">What Each Role Can Do</h2>
          </div>

          <div className="feat-tabs" data-animate>
            {Object.entries(roles).map(([key, role]) => (
              <button
                key={key}
                className={`feat-tab ${activeTab === key ? 'active' : ''}`}
                style={activeTab === key ? { '--tc': role.color } : {}}
                onClick={() => setActiveTab(key)}
              >
                <role.icon size={15}/>
                {role.label}
              </button>
            ))}
          </div>

          <div className="feat-features-grid">
            {roles[activeTab].features.map(({ icon: Icon, title, desc }, i) => (
              <div className="feat-card" key={i} data-animate style={{ '--rc': roles[activeTab].color, animationDelay: `${i * 0.05}s` }}>
                <div className="feat-card-icon" style={{ background: roles[activeTab].color + '18' }}>
                  <Icon size={20} color={roles[activeTab].color}/>
                </div>
                <h3 className="feat-card-title">{title}</h3>
                <p className="feat-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="feat-section alt-bg">
        <div className="feat-inner">
          <div className="feat-section-hd" data-animate>
            <span className="feat-tag">Submission Workflows</span>
            <h2 className="feat-h2">Step-by-Step for Each Internship Type</h2>
            <p className="feat-section-sub">Each internship type has a specific workflow. The platform enforces progression — you can't skip steps.</p>
          </div>
          <div className="feat-workflows">
            {internshipWorkflows.map(({ type, color, bg, steps, note }, i) => (
              <div className="workflow-card" key={i} data-animate style={{ '--wc': color, '--wbg': bg }}>
                <div className="workflow-header">
                  <div className="workflow-dot" style={{ background: color }}/>
                  <h3 className="workflow-title">{type}</h3>
                </div>
                <div className="workflow-steps">
                  {steps.map((step, j) => (
                    <span key={j} className="workflow-step-wrap">
                      <span
                        className="workflow-step"
                        style={step.includes('✓') ? { background: color, color: '#fff' } : step === 'Approved' ? { background: '#DCFCE7', color: '#166534' } : {}}
                      >
                        {step}
                      </span>
                      {j < steps.length - 1 && <ChevronRight size={11} style={{ color: '#A1A1AA', flexShrink: 0 }}/>}
                    </span>
                  ))}
                </div>
                <p className="workflow-note">💡 {note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="feat-section">
        <div className="feat-inner">
          <div className="feat-section-hd" data-animate>
            <span className="feat-tag">Technology</span>
            <h2 className="feat-h2">Built With Modern Stack</h2>
          </div>
          <div className="tech-grid" data-animate>
            {techStack.map(({ name, role, color, icon }, i) => (
              <div className="tech-card" key={i}>
                <div className="tech-emoji">{icon}</div>
                <div className="tech-name">{name}</div>
                <div className="tech-role">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="feat-cta">
        <div className="feat-cta-inner" data-animate>
          <h2 className="feat-cta-title">Ready to Get Started?</h2>
          <p className="feat-cta-sub">Login to InternTrack and begin your internship journey at MITS Gwalior.</p>
          <button className="feat-cta-btn" onClick={() => navigate('/login')}>
            Go to Login <ArrowRight size={16}/>
          </button>
        </div>
      </section>

      <style>{`
        .feat-root {
          --c-bg:#FAFAFA; --c-surface:#fff; --c-surface2:#F4F4F5;
          --c-border:#E4E4E7; --c-text:#09090B; --c-text2:#52525B; --c-text3:#A1A1AA;
          --c-primary:#4F46E5; --c-pl:#EEF2FF;
          --font-d:'Georgia',serif; --font-b:-apple-system,'Segoe UI',sans-serif;
          background:var(--c-bg); color:var(--c-text);
          font-family:var(--font-b); min-height:100vh;
        }
        .feat-root.dark {
          --c-bg:#09090B; --c-surface:#18181B; --c-surface2:#27272A;
          --c-border:#3F3F46; --c-text:#FAFAFA; --c-text2:#A1A1AA; --c-text3:#71717A;
          --c-pl:#1E1B4B;
        }
        [data-animate]{ opacity:0; transform:translateY(20px); transition:opacity .5s, transform .5s; }
        [data-animate].in-view{ opacity:1; transform:none; }

        .feat-nav{
          position:sticky; top:0; z-index:100;
          background:var(--c-surface); border-bottom:1px solid var(--c-border);
          backdrop-filter:blur(12px);
        }
        .feat-nav-inner{
          max-width:1200px; margin:0 auto; padding:0 24px; height:60px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .feat-back{
          display:flex; align-items:center; gap:6px;
          background:none; border:1px solid var(--c-border); border-radius:8px;
          padding:7px 14px; font-size:13px; font-weight:500;
          color:var(--c-text2); cursor:pointer; transition:background .15s, color .15s;
        }
        .feat-back:hover{ background:var(--c-surface2); color:var(--c-text); }
        .feat-nav-brand{
          display:flex; align-items:center; gap:8px;
          font-size:15px; font-weight:700; color:var(--c-text);
        }
        .feat-brand-icon{
          width:28px; height:28px; background:#4F46E5; border-radius:7px;
          display:flex; align-items:center; justify-content:center;
        }
        .feat-theme-btn{
          width:36px; height:36px; border-radius:8px;
          border:1px solid var(--c-border); background:var(--c-surface);
          color:var(--c-text2); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:background .15s;
        }
        .feat-theme-btn:hover{ background:var(--c-surface2); }

        .feat-hero{
          padding:80px 24px 60px; text-align:center;
          background:linear-gradient(180deg, var(--c-pl) 0%, var(--c-bg) 100%);
        }
        .feat-hero-inner{ max-width:640px; margin:0 auto; }
        .feat-tag{
          display:inline-block; padding:5px 14px; border-radius:999px;
          background:var(--c-pl); color:var(--c-primary);
          font-size:11.5px; font-weight:600; text-transform:uppercase;
          letter-spacing:.06em; margin-bottom:16px;
        }
        .feat-h1{
          font-family:var(--font-d); font-size:clamp(28px,5vw,48px);
          font-weight:700; color:var(--c-text); margin:0 0 16px; letter-spacing:-.02em;
          line-height:1.15;
        }
        .feat-accent{
          background:linear-gradient(135deg,#4F46E5,#0891B2);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .feat-hero-sub{ font-size:16px; color:var(--c-text2); line-height:1.7; margin:0; }

        .feat-section{ padding:72px 24px; }
        .alt-bg{ background:var(--c-surface2); }
        .feat-inner{ max-width:1200px; margin:0 auto; }
        .feat-section-hd{ text-align:center; margin-bottom:48px; }
        .feat-h2{
          font-family:var(--font-d); font-size:clamp(22px,3.5vw,36px);
          font-weight:700; color:var(--c-text); margin:0 0 12px; letter-spacing:-.02em;
        }
        .feat-section-sub{ font-size:14.5px; color:var(--c-text2); max-width:480px; margin:12px auto 0; line-height:1.65; }

        .feat-tabs{ display:flex; gap:8px; justify-content:center; margin-bottom:36px; flex-wrap:wrap; }
        .feat-tab{
          display:flex; align-items:center; gap:7px;
          padding:9px 20px; border-radius:999px;
          border:1px solid var(--c-border); background:var(--c-surface);
          font-size:13.5px; font-weight:600; color:var(--c-text2); cursor:pointer;
          transition:all .2s;
        }
        .feat-tab.active{
          background:var(--tc,#4F46E5); color:#fff; border-color:transparent;
          box-shadow:0 4px 12px rgba(0,0,0,.15);
        }
        .feat-tab:not(.active):hover{ border-color:var(--c-text3); color:var(--c-text); }

        .feat-features-grid{
          display:grid; grid-template-columns:repeat(3,1fr); gap:18px;
        }
        @media(max-width:900px){ .feat-features-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:560px){ .feat-features-grid{ grid-template-columns:1fr; } }
        .feat-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:12px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,.05);
          transition:transform .2s, box-shadow .2s;
          border-top:3px solid var(--rc,#4F46E5);
        }
        .feat-card:hover{ transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
        .feat-card-icon{
          width:40px; height:40px; border-radius:9px;
          display:flex; align-items:center; justify-content:center; margin-bottom:14px;
        }
        .feat-card-title{ font-size:14px; font-weight:700; color:var(--c-text); margin:0 0 8px; }
        .feat-card-desc{ font-size:13px; color:var(--c-text2); line-height:1.65; margin:0; }

        .feat-workflows{ display:flex; flex-direction:column; gap:16px; }
        .workflow-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:12px; padding:22px 24px;
          border-left:4px solid var(--wc,#4F46E5);
          box-shadow:0 1px 4px rgba(0,0,0,.04);
          transition:transform .2s;
        }
        .workflow-card:hover{ transform:translateX(4px); }
        .workflow-header{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .workflow-dot{ width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .workflow-title{ font-size:14.5px; font-weight:700; color:var(--c-text); margin:0; }
        .workflow-steps{ display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .workflow-step-wrap{ display:flex; align-items:center; gap:6px; }
        .workflow-step{
          font-size:11.5px; font-weight:500; padding:4px 11px; border-radius:6px;
          background:var(--c-surface2); color:var(--c-text2);
        }
        .workflow-note{ font-size:12.5px; color:var(--c-text3); margin:0; }

        .tech-grid{
          display:grid; grid-template-columns:repeat(4,1fr); gap:14px;
        }
        @media(max-width:768px){ .tech-grid{ grid-template-columns:repeat(2,1fr); } }
        .tech-card{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:12px; padding:20px 16px; text-align:center;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:transform .2s, box-shadow .2s;
        }
        .tech-card:hover{ transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,.08); }
        .tech-emoji{ font-size:26px; margin-bottom:10px; }
        .tech-name{ font-size:13.5px; font-weight:700; color:var(--c-text); margin-bottom:4px; }
        .tech-role{ font-size:11.5px; color:var(--c-text3); }

        .feat-cta{
          padding:72px 24px; text-align:center;
          background:linear-gradient(135deg,#4F46E5,#0891B2);
        }
        .feat-cta-inner{ max-width:480px; margin:0 auto; }
        .feat-cta-title{ font-family:var(--font-d); font-size:clamp(22px,4vw,36px); font-weight:700; color:#fff; margin:0 0 12px; }
        .feat-cta-sub{ font-size:15px; color:rgba(255,255,255,.8); margin:0 0 28px; }
        .feat-cta-btn{
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 24px; border-radius:10px;
          background:#fff; color:#4F46E5;
          border:none; font-size:14.5px; font-weight:700; cursor:pointer;
          transition:transform .15s, box-shadow .15s;
          box-shadow:0 4px 14px rgba(0,0,0,.2);
        }
        .feat-cta-btn:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.25); }
      `}</style>
    </div>
  );
};

export default FeaturesPage;