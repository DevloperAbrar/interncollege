import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Activity, GraduationCap, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cleanName, initialsOf } from '../../utils/studentUi'

const NAV = [
  {
    name: 'Dashboard',
    short: 'Home',
    path: '/student/dashboard',
    icon: LayoutDashboard,
    // pages that are part of the submission flow keep "Dashboard" highlighted
    also: [
      '/student/choice',
      '/student/registration',
      '/student/mpr',
      '/student/final-report',
      '/student/placement',
      '/student/internship',
      '/student/project',
      '/student/monthly'
    ]
  },
  { name: 'My Progress', short: 'Progress', path: '/student/progress', icon: Activity, also: [] }
]

const isNavActive = (item, pathname) => pathname === item.path || item.also.includes(pathname)

const Avatar = ({ user, name, className = 'h-10 w-10 text-sm' }) =>
  user?.profilePhoto ? (
    <img src={user.profilePhoto} alt={name} className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white`}
    >
      {initialsOf(user?.name)}
    </div>
  )

const SidebarContent = ({ user, name, pathname, onNavigate, onLogout }) => (
  <div className="flex h-full flex-col">
    {/* Brand */}
    <div className="flex items-center gap-3 px-5 pb-4 pt-6">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold text-slate-900">InternTrack</p>
        <p className="text-xs text-slate-500">MITS-DU · Student Portal</p>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = isNavActive(item, pathname)
          const Icon = item.icon
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 transition-all ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                {item.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>

    {/* User */}
    <div className="border-t border-slate-200 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <Avatar user={user} name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900" title={name}>
            {name || 'Student'}
          </p>
          <p className="truncate text-xs text-slate-500" title={user?.email}>
            {user?.email || 'Student'}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          aria-label="Sign out"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
)

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const name = cleanName(user?.name)

  // close the menu and scroll to top whenever the page changes
  useEffect(() => {
    setDrawerOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Esc closes the menu, and the page behind it does not scroll while it is open
  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  return (
    <div className="st-app min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <SidebarContent user={user} name={name} pathname={pathname} onLogout={logout} />
      </aside>

      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/student/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold text-slate-900">InternTrack</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-full ring-2 ring-transparent transition hover:ring-indigo-200"
          >
            <Avatar user={user} name={name} className="h-9 w-9 text-xs" />
          </button>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      <div className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-[84%] max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent
            user={user}
            name={name}
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
            onLogout={logout}
          />
        </aside>
      </div>

      {/* Page content */}
      <div className="lg:pl-72">
        <main className="st-main mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div key={pathname} className="st-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Quick navigation"
        className="st-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-3">
          {NAV.map((item) => {
            const active = isNavActive(item, pathname)
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? 'text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`absolute top-0 h-0.5 rounded-b-full bg-indigo-600 transition-all duration-300 ${
                      active ? 'w-10 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                  <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
                  {item.short}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
            >
              <Menu className="h-5 w-5" />
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default StudentLayout