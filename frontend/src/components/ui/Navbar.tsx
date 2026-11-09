import { useState, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuth';

export interface NavbarProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function Navbar({ isDark, onToggleDark }: NavbarProps): ReactElement {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (
      path === '/found' &&
      (location.pathname === '/' || location.pathname.startsWith('/found'))
    ) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Found Items', href: '/found' },
    { label: 'Lost Notices', href: '/lost' },
    ...(user
      ? [
          { label: 'Report Found', href: '/report-found' },
          { label: 'Post Lost', href: '/report-lost' },
        ]
      : []),
    ...(user?.role === 'ADMIN' ? [{ label: '🛡️ Moderation', href: '/admin/reports' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md transition-colors dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="bg-brand-600 group-hover:bg-brand-700 flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm transition-colors">
              F
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                Campus L&amp;F
              </span>
              <span className="text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                FUTA Recovery Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Status / Auth Links */}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold leading-none text-gray-900 dark:text-gray-100">
                  {user.name}
                </span>
                <span className="text-brand-600 dark:text-brand-400 mt-0.5 inline-block text-[10px] font-medium">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-brand-600 hover:bg-brand-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                Create account
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 md:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="animate-fade-in space-y-2 border-t border-gray-200 bg-white px-4 pb-5 pt-3 md:hidden dark:border-gray-800 dark:bg-gray-900">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-4 py-2.5 text-sm font-semibold ${
                isActive(link.href)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span className="text-brand-600 mt-1 inline-block text-[10px] font-bold uppercase">
                    Role: {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-brand-600 flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
