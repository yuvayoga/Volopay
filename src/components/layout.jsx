import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

export default function Layout() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isManual, setIsManual] = useState(() => Boolean(localStorage.getItem('theme')));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (isManual) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [isManual]);

  const toggleTheme = () => {
    setIsManual(true);
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/applications', label: 'Applications' },
    { to: '/pipeline', label: 'Pipeline Board' },
  ];

  const linkCls = ({ isActive }) =>
    `px-3 py-1 rounded text-xs font-medium ${isActive ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-blue-600 dark:text-blue-400">JobApplicationTracker</Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkCls} end={l.to === '/'}>{l.label}</NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="px-2 py-1 text-xs border rounded dark:border-slate-700">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <Link to="/applications/new" className="px-3 py-1 text-xs bg-blue-600 text-white rounded">
              + New Application
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
