# Frontend Specification

---

# 1. Frontend Overview

## Module Name

Frontend - Web Paper Tracker System

---

## Goal

Frontend chịu trách nhiệm cung cấp giao diện người dùng cho hệ thống theo dõi bài báo khoa học. Ứng dụng hiện tập trung vào các luồng chính:

- Đăng ký, đăng nhập, đăng xuất và bảo vệ route bằng JWT.
- Xem danh sách paper, lọc paper gần đây và tìm kiếm paper.
- Xem chi tiết paper, tóm tắt, tổng quan bài báo, tác giả, ngày công bố và link arXiv.
- Lưu/bỏ lưu paper yêu thích.
- Theo dõi lịch sử đọc paper.
- Quản lý chủ đề, chủ đề theo dõi và paper theo từng chủ đề.
- Xem topic xu hướng.
- Xem paper liên quan, paper trùng/gần giống và chấm điểm paper.
- Nhận notification realtime qua SSE.
- Trigger crawler thủ công từ Dashboard hoặc theo từng topic.

---

## Current Integration Status

Frontend hiện đã nối với Backend prefix:

```txt
http://localhost:8000/api/v1
```

Các nhóm API chính đã có helper trong `src/services/API.js` và đang được UI sử dụng:

- Auth
- Papers
- Topics
- User topics
- Favorites
- History
- Related papers
- Matching papers
- Ratings
- Stats/trends
- Notifications/SSE
- Manual crawler

Ghi chú: chức năng quên mật khẩu trên UI hiện mới là luồng hiển thị thông báo local, chưa gọi reset-password thật từ Backend.

---

# 2. Frontend Architecture

## Architecture Style

Frontend dùng React component-based architecture, React Router cho route và Axios service layer để giao tiếp với Backend.

```txt
Browser
    |
    v
React App
    |
    v
Routes / Pages
    |
    v
Components / Contexts
    |
    v
services/API.js
    |
    v
Backend REST API / SSE
```

---

## Runtime Flow

```txt
User action
    |
    v
Page component
    |
    v
API helper in services/API.js
    |
    v
Backend /api/v1
    |
    v
Normalize response in page
    |
    v
Render loading / error / data state
```

---

## Realtime Notification Flow

```txt
Database pipeline creates notification
        |
        v
Backend internal notification push
        |
        v
Backend SSE /api/v1/notifications/stream
        |
        v
NotificationBell receives event
        |
        v
Refresh notification list
        |
        v
Dispatch paper-data-updated event
        |
        v
Dashboard / Topics / Tracking Topics / Trend refetch current data
```

---

## Manual Crawler Flow

```txt
User clicks "Tải lại"
        |
        v
CrawlerContext.startCrawler()
        |
        v
POST /api/v1/crawler/run
        |
        v
Backend starts Database pipeline job
        |
        v
CrawlerContext polls GET /api/v1/crawler/status
        |
        v
When done: refresh notifications and paper lists
```

---

# 3. Tech Stack

## Core

- React 19
- Vite
- React Router DOM v7

## Styling

- Tailwind CSS v4
- `@tailwindcss/vite`

## HTTP & Utilities

- Axios
- EventSource API for SSE notifications
- Browser `localStorage` for auth token and username

## Icons

- `lucide-react`

## Development Tools

- ESLint
- Vite dev server

---

# 4. Current Folder Structure

```txt
frontend/
|-- README.md
|-- spec.md
|-- package.json
|-- package-lock.json
|-- vite.config.js
|-- eslint.config.js
|-- index.html
|-- public/
|-- src/
    |-- main.jsx
    |-- App.jsx
    |-- App.css
    |-- index.css
    |-- assets/
    |   |-- background.jpg
    |-- components/
    |   |-- ErrorModal.jsx
    |   |-- MainLayout.jsx
    |   |-- NotificationBell.jsx
    |   |-- Pagination.jsx
    |   |-- PaperCard.jsx
    |   |-- PaperModal.jsx
    |   |-- ProtectedRoute.jsx
    |   |-- SearchBar.jsx
    |   |-- Sidebar.jsx
    |   |-- SuccessModal.jsx
    |-- contexts/
    |   |-- CrawlerContext.jsx
    |   |-- FavoritesContext.jsx
    |-- page/
    |   |-- DashboardPage.jsx
    |   |-- FavoritesPage.jsx
    |   |-- HistoryPage.jsx
    |   |-- LoginPage.jsx
    |   |-- PaperDetailPage.jsx
    |   |-- RegisterPage.jsx
    |   |-- Settingpage.jsx
    |   |-- TopicsPage.jsx
    |   |-- TrackingTopicPage.jsx
    |   |-- TrendPage.jsx
    |-- services/
    |   |-- API.js
    |-- utils/
        |-- notificationRefreshEvent.js
        |-- paperRefreshEvent.js
```

---

# 5. Setup Steps

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

---

## Step 2: Configure Environment

Frontend có thể chạy không cần `.env` vì `src/services/API.js` đã có default:

```txt
http://localhost:8000/api/v1
```

Nếu muốn cấu hình rõ, tạo file:

```txt
frontend/.env
```

Nội dung:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Lưu ý:

- `VITE_API_URL` phải bao gồm `/api/v1`.
- Không đổi thành `http://localhost:8000/api` nếu Backend vẫn mount route ở `/api/v1`.

---

## Step 3: Run Development Server

```bash
npm run dev
```

Vite config hiện đặt port:

```txt
http://localhost:5713
```

---

## Step 4: Build, Preview, Lint

```bash
npm run build
npm run preview
npm run lint
```

---

# 6. API Contract

## 6.1 Base URL

File:

```txt
frontend/src/services/API.js
```

Base URL:

```js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
```

---

## 6.2 Auth Token Handling

Axios interceptor tự gắn token vào request:

```txt
Authorization: Bearer <access_token>
```

Token được lưu ở:

```txt
localStorage.access_token
localStorage.username
```

Khi login/logout/update username, FE dispatch event để các context/component đồng bộ lại state:

```txt
auth-change
username-updated
storage
```

---

## 6.3 API Overview

| Domain | Function | Method | Endpoint | UI sử dụng | Trạng thái |
|---|---|---:|---|---|---|
| Auth | `login` | POST | `/auth/login` | `LoginPage` | Implemented |
| Auth | `register` | POST | `/auth/register` | `RegisterPage` | Implemented |
| Auth | `getProfile` | GET | `/auth/me` | `Settingpage` | Implemented |
| Auth | `updateProfile` | PUT | `/auth/profile` | `Settingpage` | Implemented |
| Auth | `changePassword` | PUT | `/auth/change-password` | `Settingpage` | Implemented |
| Auth | `forgotPassword` | POST | `/auth/forgot-password` | Chưa gọi trong UI thật | Future / Not wired |
| Papers | `getPapers` | GET | `/papers` | `DashboardPage` | Implemented |
| Papers | `searchPapers` | GET | `/papers/search` | `DashboardPage` | Implemented |
| Papers | `getPapersByTopic` | GET | `/papers?topic_id=:id` | `TopicsPage`, `TrackingTopicPage`, `TrendPage` | Implemented |
| Papers | `getPaperById` | GET | `/papers/:id` | `PaperDetailPage` | Implemented |
| Papers | `summarizePaper` | POST | `/papers/:id/summarize` | `PaperDetailPage` | Implemented |
| Papers | `getRelatedPapers` | GET | `/papers/:id/related` | `PaperDetailPage` | Implemented |
| Papers | `getMatchingPapers` | GET | `/papers/:id/matches` | `PaperDetailPage` | Implemented |
| Ratings | `getMyRating` | GET | `/papers/:id/rating/me` | `PaperDetailPage` | Implemented |
| Ratings | `submitRating` | POST | `/papers/:id/rating` | `PaperDetailPage` | Implemented |
| Topics | `getTopics` | GET | `/topics` | `TopicsPage`, `TrackingTopicPage` | Implemented |
| User Topics | `getTrackedTopics` | GET | `/user-topics` | `TrackingTopicPage` | Implemented |
| User Topics | `trackTopic` | POST | `/user-topics` | `TrackingTopicPage` | Implemented |
| User Topics | `untrackTopic` | DELETE | `/user-topics/:topicId` | `TrackingTopicPage` | Implemented |
| Favorites | `getFavorites` | GET | `/favorites` | `FavoritesPage`, `FavoritesContext` | Implemented |
| Favorites | `addFavorite` | POST | `/papers/favorite/:paperId` | `PaperCard`, `PaperDetailPage` | Implemented |
| Favorites | `removeFavorite` | DELETE | `/papers/favorite/:paperId` | `PaperCard`, `PaperDetailPage` | Implemented |
| History | `getHistory` | GET | `/history` | `HistoryPage` | Implemented |
| History | `removeHistory` | DELETE | `/history/:paperId` | `HistoryPage` | Implemented |
| History | `clearHistory` | DELETE | `/history` | `HistoryPage` | Implemented |
| Trends | `getTrendingTopics` | GET | `/stats/topics/trends` | `TrendPage` | Implemented |
| Notifications | `getNotifications` | GET | `/notifications` | `NotificationBell` | Implemented |
| Notifications | `markNotificationRead` | PATCH | `/notifications/:id/read` | `NotificationBell` | Implemented |
| Notifications | `markAllNotificationsRead` | PATCH | `/notifications/read-all` | `NotificationBell` | Implemented |
| Notifications | `createNotificationStream` | GET | `/notifications/stream?token=...` | `NotificationBell` | Implemented |
| Crawler | `runCrawler` | POST | `/crawler/run` | `DashboardPage`, `TopicsPage` | Implemented |
| Crawler | `getCrawlerStatus` | GET | `/crawler/status` | `CrawlerContext` | Implemented |

---

## 6.4 Query Params Đang Dùng

### Paper list

```txt
GET /api/v1/papers?page=1&limit=5&filter=all
GET /api/v1/papers?page=1&limit=5&filter=recent
GET /api/v1/papers?page=1&limit=5&filter=2days
GET /api/v1/papers?page=1&limit=5&topic_id=1
```

### Search

```txt
GET /api/v1/papers/search?q=machine&page=1&limit=5
```

### Favorites / History

```txt
GET /api/v1/favorites?page=1&limit=5
GET /api/v1/history?page=1&limit=5&search=machine
```

### Notifications

```txt
GET /api/v1/notifications?page=1&limit=10
GET /api/v1/notifications/stream?token=<access_token>
```

### Manual crawler

Dashboard refresh:

```json
{
  "max_results": 5
}
```

Topic refresh:

```json
{
  "topic_id": 1,
  "max_results": 5
}
```

---

## 6.5 Response Shape FE Kỳ Vọng

FE đang xử lý linh hoạt các dạng response sau:

```json
{
  "success": true,
  "message": "OK",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 20,
    "total_pages": 4
  }
}
```

Hoặc dạng nested:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 20,
      "total_pages": 4
    }
  }
}
```

Các page hiện đều có logic normalize response để tránh vỡ UI khi response bị bọc khác nhau.

---

# 7. Routing Specification

## 7.1 Route Table

| Route | Page | Auth | Mục đích |
|---|---|---:|---|
| `/` | `LoginPage` | Public | Đăng nhập |
| `/dang-ky` | `RegisterPage` | Public | Đăng ký |
| `/dashboard` | `DashboardPage` | Required | Danh sách paper, filter, search, manual refresh |
| `/favorites` | `FavoritesPage` | Required | Paper yêu thích |
| `/history` | `HistoryPage` | Required | Lịch sử đọc |
| `/topics` | `TopicsPage` | Required | Xem tất cả topic và paper theo topic |
| `/trend` | `TrendPage` | Required | Topic xu hướng và paper theo topic xu hướng |
| `/tracking-topics` | `TrackingTopicPage` | Required | Quản lý topic user đang theo dõi |
| `/tracking-topics?topic_id=1` | `TrackingTopicPage` | Required | Mở topic theo dõi từ notification |
| `/paper/:id` | `PaperDetailPage` | Required | Chi tiết paper |
| `/settings` | `Settingpage` | Required | Cài đặt tài khoản |

---

## 7.2 Protected Route Rule

`ProtectedRoute` kiểm tra:

```txt
localStorage.access_token
```

Nếu chưa có token, user được redirect về `/` và route cũ được lưu trong `location.state.from`.

---

# 8. Feature Specification

## 8.1 Auth

Đã có:

- Login bằng email/password.
- Register bằng username/email/password.
- Lưu `access_token` và `username` vào localStorage.
- Logout xóa localStorage và quay về login.
- Protected routes.
- Cập nhật username trong Settings.
- Đổi mật khẩu trong Settings.

Chưa có:

- Reset password thật qua email/token.
- Centralized auto logout khi token hết hạn hoặc API trả `401`.

---

## 8.2 Dashboard Paper List

`DashboardPage` đang hỗ trợ:

- Hiển thị paper theo trang, mặc định 5 paper/trang.
- Filter:
  - `all`
  - `recent`
  - `2days`
- Search qua `GET /papers/search`.
- Toggle favorite.
- Badge paper mới khi `paper.is_new = true` và `paper.is_read = false`.
- Tự refetch khi nhận event paper mới từ SSE hoặc manual crawler hoàn tất.
- Nút `Tải lại` gọi manual crawler với `max_results = 5`.
- Hiển thị trạng thái crawler đang chạy và countdown cooldown.

---

## 8.3 Topics

`TopicsPage` đang hỗ trợ:

- Lấy tất cả topic từ `GET /topics`.
- Chọn một topic để xem paper qua `GET /papers?topic_id=:id`.
- Pagination 5 paper/trang.
- Nút `Tải lại` cho topic đang chọn:

```json
{
  "topic_id": 1,
  "max_results": 5
}
```

- Không cho chạy chồng crawler nếu đang có job chạy.
- Hiển thị cooldown nếu Backend trả trạng thái đang chờ.
- Tự refetch paper list nếu notification/crawler báo có paper mới thuộc topic hiện tại.

---

## 8.4 Tracked Topics

`TrackingTopicPage` đang hỗ trợ:

- Lấy tất cả topic và topic user đang theo dõi.
- Thêm topic theo dõi từ combobox.
- Bỏ theo dõi topic.
- Chọn topic đang theo dõi để xem paper.
- Hỗ trợ query `topic_id` để mở topic từ notification:

```txt
/tracking-topics?topic_id=1
```

---

## 8.5 Paper Detail

`PaperDetailPage` đang hỗ trợ:

- Lấy chi tiết paper bằng `GET /papers/:id`.
- Backend có thể mark paper là đã đọc khi mở chi tiết.
- Nếu `summary` đang trống, FE gọi `POST /papers/:id/summarize`.
- Hiển thị:
  - `Tóm tắt` cho summary.
  - `Tổng quan bài báo` cho abstract.
  - Tác giả.
  - Ngày công bố.
  - Link đọc toàn văn trên arXiv.
- Toggle favorite trong trang chi tiết.
- Lấy paper liên quan bằng `GET /papers/:id/related`.
- Lấy paper trùng/gần giống bằng `GET /papers/:id/matches`.
- Chấm điểm paper 1-10 sao.
- Lấy điểm user đã chấm bằng `GET /papers/:id/rating/me`.

Lưu ý: Chỉ gọi summarize on-demand ở trang chi tiết, không gọi hàng loạt ở Dashboard/List để tránh tốn thời gian và quota AI.

---

## 8.6 Favorites

Đã có:

- Lấy danh sách favorite có pagination.
- Toggle favorite từ `PaperCard`.
- Toggle favorite từ `PaperDetailPage`.
- Optimistic update qua `FavoritesContext`.
- Rollback local state nếu API lỗi.

---

## 8.7 History

Đã có:

- Lấy lịch sử đọc có pagination.
- Search trong lịch sử bằng query `search`.
- Xóa từng paper khỏi lịch sử.
- Xóa toàn bộ lịch sử.

---

## 8.8 Trends

`TrendPage` đang hỗ trợ:

- Lấy topic xu hướng từ `GET /stats/topics/trends`.
- Chọn topic xu hướng để xem paper theo topic.
- Pagination 5 paper/trang.
- Refetch khi nhận event paper data update.

---

## 8.9 Notifications

`NotificationBell` đang hỗ trợ:

- Lấy danh sách notification.
- Mở SSE stream:

```txt
GET /api/v1/notifications/stream?token=<access_token>
```

- Hiển thị số notification chưa đọc trên chuông.
- Mark một notification là đã đọc.
- Mark tất cả notification là đã đọc.
- Click notification topic để chuyển sang:

```txt
/tracking-topics?topic_id=<topic_id>
```

- Khi nhận SSE notification mới, FE tự:
  - refresh chuông notification.
  - phát event để các page paper refetch dữ liệu.

---

## 8.10 Manual Crawler Refresh

Crawler refresh được quản lý bằng `CrawlerContext`.

Đã có:

- Global crawler state ở cấp `App`.
- `isCrawlerRunning`.
- `crawlerStatus`.
- `crawlerCooldownSeconds`.
- Poll `GET /crawler/status` mỗi 2 giây khi job đang chạy.
- Countdown cooldown mỗi 1 giây khi job đã xong nhưng còn cooldown.
- Dispatch refresh event cho notification và paper list khi job hoàn tất.

UI đang dùng:

- Dashboard: tải 5 paper mới nhất trong nhóm topic mặc định.
- TopicsPage: tải 5 paper mới cho topic đang chọn.

---

## 8.11 Search

Search bar nằm trong `MainLayout`.

Hiện tại:

- Ẩn SearchBar ở route `/settings`.
- Debounce 300ms.
- `DashboardPage` dùng search để gọi `GET /papers/search`.
- `HistoryPage` dùng search để gọi `GET /history?search=...`.

Ghi chú: SearchBar vẫn hiển thị trên một số page chưa trực tiếp tiêu thụ `searchQuery` như Favorites/Topics/Tracking Topics/Trend.

---

# 9. Component Responsibilities

| Component | File | Trách nhiệm |
|---|---|---|
| `App` | `src/App.jsx` | Khai báo router, bọc `FavoritesProvider`, `CrawlerProvider` |
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | Chặn route nếu chưa có token |
| `MainLayout` | `src/components/MainLayout.jsx` | Layout chính, Sidebar, Header, SearchBar, NotificationBell, Outlet |
| `Sidebar` | `src/components/Sidebar.jsx` | Navigation, logout, user menu, Settings link |
| `SearchBar` | `src/components/SearchBar.jsx` | Search input có debounce và clear |
| `NotificationBell` | `src/components/NotificationBell.jsx` | Notification list, unread count, mark read, SSE |
| `PaperCard` | `src/components/PaperCard.jsx` | Hiển thị paper dạng card, badge mới, favorite, quick modal |
| `PaperModal` | `src/components/PaperModal.jsx` | Xem nhanh summary hoặc abstract của paper |
| `Pagination` | `src/components/Pagination.jsx` | Pagination rút gọn bằng dấu `...` |
| `FavoritesContext` | `src/contexts/FavoritesContext.jsx` | Lưu set favorite IDs và toggle favorite |
| `CrawlerContext` | `src/contexts/CrawlerContext.jsx` | Global crawler status, cooldown, manual crawler trigger |

---

# 10. State Management

## Local Storage

| Key | Ý nghĩa |
|---|---|
| `access_token` | JWT token dùng cho Bearer auth |
| `username` | Tên hiển thị trong Sidebar/Header |

---

## React Contexts

### FavoritesContext

Quản lý:

- `favoriteIds`
- `toggleFavorite`
- `refreshFavorites`
- `isLoggedIn`

### CrawlerContext

Quản lý:

- `isCrawlerRunning`
- `crawlerStatus`
- `crawlerCooldownSeconds`
- `startCrawler`
- `refreshCrawlerStatus`

---

## Internal Browser Events

| Event | File | Mục đích |
|---|---|---|
| `auth-change` | Login/Logout/FavoritesContext | Đồng bộ trạng thái đăng nhập |
| `username-updated` | Settingpage/MainLayout | Đồng bộ username sau khi đổi tên |
| `notifications-updated` | `notificationRefreshEvent.js` | Yêu cầu NotificationBell reload |
| `paper-data-updated` | `paperRefreshEvent.js` | Yêu cầu paper pages refetch |

---

# 11. Coding Rules

## API Rule

- Mọi API call phải đi qua `src/services/API.js`.
- Không hardcode full backend URL ở page/component.
- `VITE_API_URL` phải giữ prefix `/api/v1`.

## Auth Rule

- Route cần đăng nhập phải bọc bằng `ProtectedRoute`.
- Login/logout phải dispatch `auth-change` để context đồng bộ.
- Update username phải dispatch `username-updated`.

## Summary Rule

- Chỉ gọi `POST /papers/:id/summarize` ở trang chi tiết paper.
- Không gọi summarize hàng loạt ở Dashboard/Favorites/Topics/History.

## Crawler Rule

- Không gọi `/crawler/run` trực tiếp từ page.
- Page phải dùng `useCrawler().startCrawler()` để tránh chạy chồng job và giữ trạng thái khi đổi route.

## Notification Rule

- Realtime notification dùng `NotificationBell` + SSE.
- Page paper list chỉ subscribe `paper-data-updated`, không tự mở SSE riêng.

## Pagination Rule

- Các danh sách paper hiện dùng 5 item/trang.
- Pagination phải dùng `Pagination.jsx` để tránh hiển thị quá dài khi nhiều trang.

---

# 12. Definition of Done

Frontend core hiện đạt:

- [x] Login/register/logout.
- [x] Protected routes.
- [x] Dashboard paper list có pagination, filter và search.
- [x] Paper detail có summary, abstract, authors, published date, pdf URL.
- [x] Summary on-demand khi DB chưa có summary.
- [x] Favorites.
- [x] History.
- [x] Topics và paper theo topic.
- [x] User tracked topics.
- [x] Trend topics.
- [x] Related papers.
- [x] Matching/duplicate papers.
- [x] Paper rating.
- [x] Notification bell.
- [x] SSE realtime notification.
- [x] Manual crawler refresh ở Dashboard.
- [x] Manual crawler refresh theo topic ở TopicsPage.
- [x] Auto refresh paper list khi nhận notification/crawler event.
- [x] Badge paper mới/chưa đọc.
- [x] Settings update profile và change password.
- [ ] Reset password thật qua email/token.
- [ ] Centralized handler cho API `401` để auto logout hoặc yêu cầu đăng nhập lại.
- [ ] FE automated tests.
- [ ] Kiểm tra lại việc SearchBar đang hiển thị trên các page không dùng `searchQuery`.

---

# 13. Known Issues & TODOs

1. `forgotPassword()` có helper trong `API.js`, nhưng `LoginPage` hiện chưa gọi Backend reset password thật.
2. SearchBar là global trong `MainLayout`, nhưng hiện chỉ `DashboardPage` và `HistoryPage` dùng trực tiếp `searchQuery`.
3. `ProtectedRoute` mới kiểm tra token tồn tại trong localStorage, chưa verify token hết hạn từ Backend trước khi render.
4. Chưa có test tự động cho các page/component chính.
5. Nếu Backend thay đổi response wrapper, cần tiếp tục giữ normalize response ở page hoặc thống nhất một response format chung.
