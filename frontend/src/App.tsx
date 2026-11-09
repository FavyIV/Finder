import { useState, useEffect, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Navbar } from './components/ui/Navbar';
import { ToastProvider } from './hooks/useToast';

export function App(): ReactElement {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleToggleDark = (): void => {
    setIsDark((prev) => !prev);
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
          <Navbar isDark={isDark} onToggleDark={handleToggleDark} />
          <main className="flex-1">
            <Routes>
              {/* Home & Found directory */}
              <Route path="/" element={<SearchFoundItemsPage />} />
              <Route path="/found" element={<SearchFoundItemsPage />} />
              <Route path="/found/:id" element={<FoundListingDetailPage />} />
              <Route path="/found/:id/edit" element={<EditFoundListingPage />} />
              <Route path="/report-found" element={<ReportFoundItemPage />} />

              {/* Lost notices directory */}
              <Route path="/lost" element={<SearchLostItemsPage />} />
              <Route path="/lost/:id/edit" element={<EditLostListingPage />} />
              <Route path="/report-lost" element={<ReportLostItemPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Moderation */}
              <Route path="/admin/reports" element={<AdminModerationPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
