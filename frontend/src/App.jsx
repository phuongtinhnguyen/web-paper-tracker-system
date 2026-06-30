import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { CrawlerProvider } from './contexts/CrawlerContext';
import MainLayout from './components/MainLayout';
import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import DashboardPage from './page/DashboardPage';
import FavoritesPage from './page/FavoritesPage';
import HistoryPage from './page/HistoryPage';
import TopicPage from './page/TopicsPage';
import TrackingTopics from './page/TrackingTopicPage';
import TrendPage from './page/TrendPage';
import PaperDetailPage from './page/PaperDetailPage';
import SettingsPage from './page/Settingpage';
import ProtectedRoute from './components/ProtectedRoute';
// Component bảo vệ route - chỉ cho phép user đã đăng nhập truy cập

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = useCallback((q) => setSearchQuery(q), []);
  const handleClearSearch = useCallback(() => setSearchQuery(""), []);

  return (
    <BrowserRouter>
      <FavoritesProvider>
        <CrawlerProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />

            <Route element={
              <ProtectedRoute>
                <MainLayout
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage searchQuery={searchQuery} />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/topics" element={
                <ProtectedRoute>
                  <TopicPage />
                </ProtectedRoute>
              } />
              <Route path="/trend" element={
                <ProtectedRoute>
                  <TrendPage />
                </ProtectedRoute>
              } />
              <Route path="/tracking-topics" element={
                <ProtectedRoute>
                  <TrackingTopics />
                </ProtectedRoute>
              } />
              <Route path="/paper/:id" element={
                <ProtectedRoute>
                  <PaperDetailPage />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </CrawlerProvider>
      </FavoritesProvider>
    </BrowserRouter>
  );
}

export default App;
