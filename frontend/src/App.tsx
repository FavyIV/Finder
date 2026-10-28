import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportFoundItemPage } from './pages/ReportFoundItemPage';
import { SearchFoundItemsPage } from './pages/SearchFoundItemsPage';
import { FoundListingDetailPage } from './pages/FoundListingDetailPage';
import { EditFoundListingPage } from './pages/EditFoundListingPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { SearchLostItemsPage } from './pages/SearchLostItemsPage';
import { ReportLostItemPage } from './pages/ReportLostItemPage';
import { EditLostListingPage } from './pages/EditLostListingPage';
import { useCurrentUser, useLogout } from './hooks/useAuth';

function HomePage(): ReactElement {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-brand-900 text-3xl font-bold tracking-tight">
          Campus Lost &amp; Found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Official recovery portal for the university community
        </p>

        <div className="mt-6 border-t border-gray-100 pt-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Checking authentication...</p>
          ) : user ? (
            <div className="space-y-4">
              <div className="bg-brand-50 rounded-md p-4 text-left">
                <p className="text-brand-900 text-sm font-semibold">{user.name}</p>
                <p className="text-brand-700 text-xs">{user.email}</p>
                <span className="bg-brand-100 text-brand-800 mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Role: {user.role}
                </span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/found"
                    className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex justify-center rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2"
                  >
                    🔍 Found Items
                  </Link>
                  <Link
                    to="/lost"
                    className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex justify-center rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2"
                  >
                    📋 Lost Notices
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/report-found"
                    className="focus:ring-brand-500 flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                  >
                    + Report Found
                  </Link>
                  <Link
                    to="/report-lost"
                    className="focus:ring-brand-500 flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                  >
                    + Post Lost
                  </Link>
                </div>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/reports"
                    className="flex w-full justify-center rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    🛡️ Admin Moderation Queue
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={logout}
                className="focus:ring-brand-500 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/login"
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="focus:ring-brand-500 flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
              >
                Create account (@futa.edu.ng)
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/found" element={<SearchFoundItemsPage />} />
        <Route path="/found/:id" element={<FoundListingDetailPage />} />
        <Route path="/found/:id/edit" element={<EditFoundListingPage />} />
        <Route path="/report-found" element={<ReportFoundItemPage />} />
        <Route path="/lost" element={<SearchLostItemsPage />} />
        <Route path="/report-lost" element={<ReportLostItemPage />} />
        <Route path="/lost/:id/edit" element={<EditLostListingPage />} />
        <Route path="/admin/reports" element={<AdminModerationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
