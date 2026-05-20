import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './contexts/FavoritesContext';
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

  return (
    <BrowserRouter>
      <FavoritesProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />

          <Route element={
            <ProtectedRoute>
              <MainLayout 
                onSearch={(q) => setSearchQuery(q)} 
                onClearSearch={() => setSearchQuery("")} 
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
                <FavoritesPage searchQuery={searchQuery} />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage searchQuery={searchQuery} />
              </ProtectedRoute>
            } />
            <Route path="/topics" element={
              <ProtectedRoute>
                <TopicPage searchQuery={searchQuery} />
              </ProtectedRoute>
            } />
            <Route path="/trend" element={
              <ProtectedRoute>
                <TrendPage />
              </ProtectedRoute>
            } />
            <Route path="/tracking-topics" element={
              <ProtectedRoute>
                <TrackingTopics searchQuery={searchQuery} />
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
      </FavoritesProvider>
    </BrowserRouter>
  );
}

export default App;
