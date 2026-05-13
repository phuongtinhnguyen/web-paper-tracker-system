import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './page/LoginPage';
import RegisterPage from './page/RegisterPage';
import DashboardPage from './page/DashboardPage';
import FavoritesPage from './page/FavoritesPage';
import HistoryPage from './page/HistoryPage';
import TopicPage from './page/TopicsPage';
import TrackingTopics from './page/TrackingTopicPage';


function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        <Route element={
          <MainLayout 
            onSearch={(q) => setSearchQuery(q)} 
            onClearSearch={() => setSearchQuery("")} 
          />
        }>
          <Route path="/dashboard" element={<DashboardPage searchQuery={searchQuery} />} />
          <Route path="/favorites" element={<FavoritesPage searchQuery={searchQuery} />} />
          <Route path="/history" element={<HistoryPage searchQuery={searchQuery} />} />
          <Route path="/topics" element={<TopicPage searchQuery={searchQuery} />} />
          
          <Route path="/tracking-topics" element={<TrackingTopics  searchQuery={searchQuery}/>} />
        </Route>

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;