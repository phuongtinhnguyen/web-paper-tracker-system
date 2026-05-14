# Frontend Specification

---

# 1. Frontend Overview

## Module Name

Frontend - Web Paper Tracker System

---

## Goal

Frontend chịu trách nhiệm cung cấp giao diện người dùng cho hệ thống theo dõi bài báo khoa học. Ứng dụng cho phép người dùng:

- Đăng ký, đăng nhập và quản lý tài khoản
- Xem danh sách bài báo khoa học từ arXiv
- Tìm kiếm và lọc bài báo theo từ khóa, chủ đề
- Lưu bài báo yêu thích
- Theo dõi lịch sử đọc
- Quản lý chủ đề theo dõi
- Xem tóm tắt và chi tiết bài báo

---

# 2. Frontend Architecture

## Architecture Style

Frontend sử dụng mô hình component-based với React 19 và React Router v7 cho định tuyến. Kiến trúc phân tầng:

```txt
Browser
    |
    v
React Components (UI Layer)
    |
    v
Pages (Route Components)
    |
    v
Services/API Layer (axios)
    |
    v
Backend REST API
```

---

## Component Hierarchy

```txt
App (Router)
├── LoginPage
├── RegisterPage
└── MainLayout (Protected Routes)
    ├── Sidebar (Navigation)
    ├── Header (Search, User Info)
    └── Outlet (Child Routes)
        ├── DashboardPage
        │   ├── SearchBar
        │   ├── Filter Dropdown
        │   ├── PaperCard (list)
        │   │   └── PaperModal
        │   └── Pagination
        ├── FavoritesPage
        │   ├── PaperCard (list)
        │   └── Pagination
        ├── HistoryPage
        │   ├── PaperCard (list)
        │   └── Pagination
        ├── TopicsPage (Topic Management)
        ├── TrackingTopicsPage (Tracked Topics)
        └── Settings (placeholder)
```

---

# 3. Tech Stack

## Core Framework & Build

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM v7** - Client-side routing

## Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind CSS v4

## Icons

- **lucide-react** - Icon library

## HTTP Client

- **axios** - HTTP client for API calls

## Development Tools

- **ESLint** - JavaScript linter
- **@vitejs/plugin-react** - React Fast Refresh for Vite
- **autoprefixer** - CSS vendor prefixing
- **postcss** - CSS processing

---

# 4. Folder Structure

```txt
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root component with routing
    ├── App.css               # Global styles
    ├── index.css             # Tailwind imports
    │
    ├── components/           # Reusable UI components
    │   ├── MainLayout.jsx    # Layout wrapper for protected routes
    │   ├── Sidebar.jsx       # Navigation sidebar
    │   ├── PaperCard.jsx     # Paper display card
    │   ├── PaperModal.jsx    # Paper detail modal
    │   ├── SearchBar.jsx     # Search input component
    │   ├── ErrorModal.jsx    # Error notification modal
    │   └── SuccessModal.jsx  # Success notification modal
    │
    ├── page/                 # Page components (route-level)
    │   ├── LoginPage.jsx     # Login page
    │   ├── RegisterPage.jsx  # Registration page
    │   ├── DashboardPage.jsx # Main dashboard with paper list
    │   ├── FavoritesPage.jsx # Favorite papers page
    │   ├── HistoryPage.jsx   # Reading history page
    │   ├── TopicsPage.jsx    # Topic management page
    │   └── TrackingTopicPage.jsx # Tracked topics page
    │
    ├── services/             # API service layer
    │   └── API.js            # Axios instance and API functions
    │
    └── assets/               # Static assets
        └── background.jpg    # Login page background
```

---

# 5. API Service Layer

## Base Configuration

File: `src/services/API.js`

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
```

- Tự động đính kèm JWT token vào header `Authorization: Bearer <token>`
- Token được lưu trong `localStorage` với key `access_token`

## API Endpoints

### Auth APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `login(email, password)` | POST | `/auth/login` | Đăng nhập, trả về `access_token` và `user` |
| `register(name, email, password)` | POST | `/auth/register` | Đăng ký tài khoản mới |
| `forgotPassword(email)` | POST | `/auth/forgot-password` | Yêu cầu đặt lại mật khẩu |

### Papers APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getPapers(params)` | GET | `/papers` | Lấy danh sách bài báo với pagination, filter |
| `getPaperById(id)` | GET | `/papers/:id` | Lấy chi tiết bài báo |

### Topics APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getTopics()` | GET | `/topics` | Lấy danh sách chủ đề |
| `getPapersByTopic(topicId, params)` | GET | `/topics/:topicId/papers` | Lấy bài báo theo chủ đề |

### Favorites APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getFavorites(params)` | GET | `/favorites` | Lấy danh sách bài báo yêu thích |
| `addFavorite(paperId)` | POST | `/favorites/:paperId` | Thêm bài báo vào yêu thích |
| `removeFavorite(paperId)` | DELETE | `/favorites/:paperId` | Xóa bài báo khỏi yêu thích |

### History APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getHistory(params)` | GET | `/history` | Lấy lịch sử đọc bài báo |
| `removeHistory(paperId)` | DELETE | `/history/:paperId` | Xóa một mục khỏi lịch sử |
| `clearHistory()` | DELETE | `/history` | Xóa toàn bộ lịch sử |

### Tracked Topics APIs

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getTrackedTopics()` | GET | `/user/tracked-topics` | Lấy danh sách chủ đề đang theo dõi |
| `trackTopic(topicId)` | POST | `/user/tracked-topics/:topicId` | Theo dõi một chủ đề |
| `untrackTopic(topicId)` | DELETE | `/user/tracked-topics/:topicId` | Bỏ theo dõi một chủ đề |

---

# 6. Component Specifications

## MainLayout

**File:** `src/components/MainLayout.jsx`

**Responsibilities:**
- Layout chính cho các route đã xác thực
- Chứa Sidebar và Header
- Cung cấp Outlet cho child routes

**Props:**
- `readCount` - Số bài đã đọc hôm nay
- `onSearch` - Callback khi tìm kiếm
- `onClearSearch` - Callback khi xóa tìm kiếm

---

## Sidebar

**File:** `src/components/Sidebar.jsx`

**Responsibilities:**
- Hiển thị navigation menu
- Hiển thị thông tin user và menu dropdown
- Highlight route hiện tại

**Menu Items:**
| Path | Icon | Label |
|------|------|-------|
| `/dashboard` | LayoutDashboard | Dashboard |
| `/topics` | Bookmark | Quản lý Topic |
| `/favorites` | Heart | Mục yêu thích |
| `/history` | CheckCircle2 | Lịch sử đọc |
| `/tracking-topics` | BellDot | Theo dõi chủ đề |
| `/settings` | Settings | Cài đặt |

---

## PaperCard

**File:** `src/components/PaperCard.jsx`

**Responsibilities:**
- Hiển thị thông tin bài báo dạng card
- Nút mở modal xem tóm tắt
- Nút thêm/xóa khỏi yêu thích

**Props:**
- `paper` - Object bài báo
- `onToggleFavorite` - Callback toggle favorite
- `isFavorite` - Trạng thái đã lưu chưa

**Paper Object Structure:**
```javascript
{
  id: number,
  title: string,
  abstract: string,
  authors: string | string[],
  published_at: string,
  link: string,
  pdf_url: string,
  // ... other fields
}
```

---

## SearchBar

**File:** `src/components/SearchBar.jsx`

**Responsibilities:**
- Input tìm kiếm bài báo
- Xử lý debounce (nếu có)
- Callback khi submit search

---

## Modals

### ErrorModal
**File:** `src/components/ErrorModal.jsx`
- Hiển thị thông báo lỗi
- Props: `isOpen`, `onClose`, `title`, `message`

### SuccessModal
**File:** `src/components/SuccessModal.jsx`
- Hiển thị thông báo thành công
- Props: `isOpen`, `onClose`, `title`, `message`

### PaperModal
**File:** `src/components/PaperModal.jsx`
- Hiển thị chi tiết bài báo
- Props: `isOpen`, `onClose`, `paper`, `authors`

---

# 7. Page Specifications

## LoginPage

**File:** `src/page/LoginPage.jsx`

**Features:**
- Form đăng nhập với email và password
- Chức năng quên mật khẩu
- Hiển thị loading state
- Sử dụng SuccessModal/ErrorModal cho feedback
- Lưu token vào localStorage sau khi đăng nhập thành công
- Redirect to `/dashboard` sau khi đăng nhập

---

## RegisterPage

**File:** `src/page/RegisterPage.jsx`

**Features:**
- Form đăng ký với name, email, password
- Validation cơ bản
- Redirect to login page sau khi đăng ký thành công

---

## DashboardPage

**File:** `src/page/DashboardPage.jsx`

**Features:**
- Hiển thị danh sách bài báo với pagination
- Filter dropdown (Tất cả, Gần đây, 2 ngày qua)
- Search bar
- Loading state với spinner
- Error handling
- Toggle favorite cho từng bài báo
- Hiển thị tổng số bài báo

**State:**
- `papers` - Danh sách bài báo
- `loading` - Trạng thái đang tải
- `error` - Thông báo lỗi
- `currentPage` - Trang hiện tại
- `totalPages` - Tổng số trang
- `total` - Tổng số bài báo
- `filter` - Filter hiện tại
- `favorites` - Set các bài báo đã favorite

---

## FavoritesPage

**File:** `src/page/FavoritesPage.jsx`

**Features:**
- Hiển thị danh sách bài báo yêu thích
- Pagination
- Xóa khỏi yêu thích
- Search trong danh sách yêu thích

---

## HistoryPage

**File:** `src/page/HistoryPage.jsx`

**Features:**
- Hiển thị lịch sử đọc bài báo
- Xóa từng mục hoặc xóa toàn bộ
- Pagination
- Search trong lịch sử

---

## TopicsPage

**File:** `src/page/TopicsPage.jsx`

**Features:**
- Quản lý danh sách chủ đề
- Thêm chủ đề mới
- Sửa tên chủ đề
- Xóa chủ đề

---

## TrackingTopicPage

**File:** `src/page/TrackingTopicPage.jsx`

**Features:**
- Hiển thị danh sách chủ đề đang theo dõi
- Theo dõi chủ đề mới
- Bỏ theo dõi chủ đề

---

# 8. Routing Configuration

**File:** `src/App.jsx`

```javascript
<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<LoginPage />} />
    <Route path="/dang-ky" element={<RegisterPage />} />

    {/* Protected Routes with MainLayout */}
    <Route element={<MainLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/topics" element={<TopicPage />} />
      <Route path="/tracking-topics" element={<TrackingTopics />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

# 9. Authentication & State Management

## Authentication Flow

1. User đăng nhập tại `/`
2. API trả về `access_token` và `user` info
3. Lưu token vào `localStorage`:
   - `access_token` - JWT token
   - `username` - Tên người dùng hiển thị
4. Redirect to `/dashboard`
5. API interceptor tự động đính kèm token vào mỗi request

## Logout

- Xóa token khỏi localStorage
- Redirect to `/` (login page)

---

# 10. Styling System

## Design Tokens

- **Primary Color:** Emerald/Green palette (`emerald-500`, `emerald-600`, `green-600`)
- **Background:** `bg-gray-50`, `bg-white`
- **Text:** `text-gray-800`, `text-gray-600`, `text-gray-400`
- **Borders:** `border-gray-100`, `border-emerald-100`

## Common Patterns

- **Cards:** `bg-white rounded-xl border border-gray-100 p-4`
- **Buttons:** `bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700`
- **Inputs:** `rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500`
- **Shadows:** `shadow-sm`, `shadow-lg`, `shadow-2xl`

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Grid layouts cho danh sách bài báo

---

# 11. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

---

# 12. Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

# 13. Frontend Feature Tickets

```txt
FE Tickets
|-- 1. FE: Giao diện đăng nhập, đăng ký
|   |-- FE: Tạo LoginPage với form email/password
|   |-- FE: Tạo RegisterPage với form name/email/password
|   |-- FE: Xử lý loading state và error display
|   |-- FE: Lưu token sau khi đăng nhập thành công
|   |-- FE: Redirect to dashboard sau khi login
|
|-- 2. FE: Dashboard hiển thị danh sách bài báo
|   |-- FE: Tạo DashboardPage với grid/list layout
|   |-- FE: Tích hợp PaperCard component
|   |-- FE: Pagination component
|   |-- FE: Loading spinner
|   |-- FE: Error handling và empty state
|
|-- 3. FE: Tìm kiếm và lọc bài báo
|   |-- FE: Tạo SearchBar component
|   |-- FE: Filter dropdown (tất cả, gần đây, 2 ngày)
|   |-- FE: Xử lý search query params
|   |-- FE: Debounce search input
|
|-- 4. FE: Lưu và quản lý bài báo yêu thích
|   |-- FE: Nút favorite trên PaperCard
|   |-- FE: FavoritesPage hiển thị danh sách yêu thích
|   |-- FE: Optimistic update khi toggle favorite
|   |-- FE: Error rollback khi API fail
|
|-- 5. FE: Lịch sử đọc
|   |-- FE: HistoryPage hiển thị lịch sử
|   |-- FE: Nút xóa từng mục và xóa tất cả
|   |-- FE: Tích hợp với API history
|
|-- 6. FE: Quản lý chủ đề theo dõi
|   |-- FE: TopicsPage cho quản lý topic
|   |-- FE: TrackingTopicPage cho theo dõi chủ đề
|   |-- FE: Form thêm/sửa chủ đề
|   |-- FE: Danh sách chủ đề với actions
|
|-- 7. FE: Chi tiết bài báo (Modal)
|   |-- FE: PaperModal hiển thị chi tiết
|   |-- FE: Hiển thị authors, abstract, published date
|   |-- FE: Link đến PDF và trang gốc
|
|-- 8. FE: Sidebar navigation
|   |-- FE: Sidebar component với menu items
|   |-- FE: Active state highlighting
|   |-- FE: User menu dropdown
|   |-- FE: Logout functionality
|
|-- 9. FE: MainLayout và routing
|   |-- FE: MainLayout wrapper cho protected routes
|   |-- FE: React Router setup
|   |-- FE: Nested routes với Outlet
|
|-- 10. FE: API service layer
    |-- FE: Axios instance với interceptor
    |-- FE: Functions cho tất cả API endpoints
    |-- FE: Error handling thống nhất
    |-- FE: Response normalization
```

---

# 14. Definition of Done

Frontend được xem là hoàn thành khi:

- [ ] Tất cả pages và components được implement
- [ ] API integration hoạt động đúng với backend
- [ ] Authentication flow hoàn chỉnh (login, logout, token management)
- [ ] Responsive design trên mobile và desktop
- [ ] Error handling và loading states
- [ ] ESLint không có lỗi
- [ ] Build thành công không có warning
- [ ] User có thể thực hiện đầy đủ các chức năng chính

---

# 15. Known Issues & TODOs

1. **SearchBar integration** - SearchBar trong DashboardPage hiện tại chỉ log query, chưa tích hợp với API search
2. **Settings page** - Route `/settings` được định nghĩa trong Sidebar nhưng chưa implement
3. **User info display** - Sidebar hiển thị "User" cứng, chưa lấy từ localStorage
4. **Token refresh** - Chưa implement token refresh mechanism
5. **Protected routes** - Chưa có guard cho protected routes (user có thể truy cập trực tiếp URL)