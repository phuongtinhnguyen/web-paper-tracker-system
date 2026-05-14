import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import DashboardPage from './page/DashboardPage';
import FavoritesPage from './page/FavoritesPage';
import HistoryPage from './page/HistoryPage';
import TopicPage from './page/TopicsPage';
import TrackingTopics from './page/TrackingTopicPage';
import PaperDetailPage from './page/PaperDetailPage';

// Component bảo vệ route - chỉ cho phép user đã đăng nhập truy cập
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
