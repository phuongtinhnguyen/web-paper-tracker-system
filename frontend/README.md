# Frontend Module - React + Vite

## 1. Chức Năng Chính

Frontend hiện có các màn hình/chức năng:

| Nhóm | Trạng thái FE | Ghi chú tích hợp BE |
| --- | --- | --- |
| Auth | Có Login/Register/Settings | BE đã có register/login/me/profile/change-password |
| Dashboard papers | Có danh sách, filter, search, pagination | BE đã có `/papers` và `/papers/search` |
| Topics | Có quản lý topic và topic đang theo dõi | BE đã có `/topics` và `/user-topics` |
| Favorites | Có lưu/bỏ lưu/lấy danh sách yêu thích | BE đã có `/favorites` và `/papers/favorite/:id` |
| Paper detail | Có chi tiết, summary fallback, related, matching, rating UI | BE mới có detail/summary/favorite; related/matching/rating chưa có |
| History | Có page lịch sử đọc | FE đang gọi `/history`, BE chưa có API |
| Notifications | Có `NotificationBell` trong header | BE đã có `/notifications`, mark-read APIs và SSE `/notifications/stream` |
| Trend | Có page `/trend` | FE đang gọi `/stats/topics/trends`, BE chưa có API |

## 2. Cấu Trúc File Hiện Tại

```txt
frontend/
|-- README.md
|-- spec.md
|-- package.json
|-- src/
    |-- App.jsx
    |-- main.jsx
    |-- services/
    |   |-- API.js
    |-- contexts/
    |   |-- FavoritesContext.jsx
    |-- components/
    |   |-- MainLayout.jsx
    |   |-- Sidebar.jsx
    |   |-- SearchBar.jsx
    |   |-- NotificationBell.jsx
    |   |-- Pagination.jsx
    |   |-- PaperCard.jsx
    |   |-- PaperModal.jsx
    |-- page/
        |-- LoginPage.jsx
        |-- RegisterPage.jsx
        |-- DashboardPage.jsx
        |-- TopicsPage.jsx
        |-- TrackingTopicPage.jsx
        |-- FavoritesPage.jsx
        |-- HistoryPage.jsx
        |-- TrendPage.jsx
        |-- PaperDetailPage.jsx
        |-- Settingpage.jsx
```

## 3. Setup Môi Trường

Chạy từ thư mục `frontend/`:

```powershell
npm install
```

Tạo file `.env` nếu cần đổi Backend URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Nếu không có `.env`, FE dùng mặc định:

```txt
http://localhost:8000/api/v1
```

## 4. Hướng Dẫn Sử Dụng

Chạy dev server:

```powershell
npm run dev
```

Build kiểm tra:

```powershell
npm run build
```

## 5. Ghi Chú Tích Hợp API

Các API FE đang gọi nhưng BE chưa implement:

```txt
GET    /api/v1/history
DELETE /api/v1/history/:paperId
DELETE /api/v1/history
GET    /api/v1/papers/:id/related
GET    /api/v1/papers/:id/matches
GET    /api/v1/papers/:id/rating/me
POST   /api/v1/papers/:id/rating
GET    /api/v1/stats/topics/trends
```

Các phần này hiện có UI/call ở FE để chuẩn bị tích hợp, nhưng khi chạy với BE hiện tại có thể trả `404` hoặc fail âm thầm.
