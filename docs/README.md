# Project Docs

Thư mục `docs/` hiện chưa chứa tài liệu chi tiết riêng. Tài liệu chính đang được đặt ở các file sau:

```txt
README.md              # Hướng dẫn start nhanh toàn hệ thống
spec.md                # Spec tổng thể, checklist và API overview
backend/README.md      # Hướng dẫn backend + API examples
backend/spec.md        # Spec chi tiết backend
frontend/README.md     # Hướng dẫn frontend và trạng thái tích hợp API
frontend/spec.md       # Spec chi tiết frontend
database/README.md     # Hướng dẫn database, crawler, pipeline và schema
ai/README.md           # Hướng dẫn AI summary, duplicate checker, related finder và trend analyzer
```

## Sơ Đồ Kiến Trúc Tài Liệu Tổng Thể

```mermaid
flowchart TB
    RootReadme["README.md<br/>Deployment guide + system architecture"] --> RootSpec["spec.md<br/>Project spec + checklist + API overview"]
    RootReadme --> BackendDocs["backend/README.md<br/>Backend usage + API examples"]
    RootReadme --> FrontendDocs["frontend/README.md<br/>Frontend usage + API integration"]
    RootReadme --> DatabaseDocs["database/README.md<br/>Schema + migration + pipeline"]
    RootReadme --> AIDocs["ai/README.md<br/>Summary + duplicate + related + trends"]

    RootSpec --> BackendSpec["backend/spec.md<br/>Backend detailed spec"]
    RootSpec --> FrontendSpec["frontend/spec.md<br/>Frontend detailed spec"]
    BackendDocs --> BackendSpec
    FrontendDocs --> FrontendSpec
    DatabaseDocs --> RootSpec
    AIDocs --> RootSpec
```

### Sơ Đồ Kiến Trúc Tài Liệu Tổng Thể - PlantUML

```plantuml
@startuml
top to bottom direction

rectangle "README.md\nDeployment guide + system architecture" as RootReadme
rectangle "spec.md\nProject spec + checklist + API overview" as RootSpec
rectangle "backend/README.md\nBackend usage + API examples" as BackendDocs
rectangle "frontend/README.md\nFrontend usage + API integration" as FrontendDocs
rectangle "database/README.md\nSchema + migration + pipeline" as DatabaseDocs
rectangle "ai/README.md\nSummary + duplicate + related + trends" as AIDocs
rectangle "backend/spec.md\nBackend detailed spec" as BackendSpec
rectangle "frontend/spec.md\nFrontend detailed spec" as FrontendSpec

RootReadme --> RootSpec
RootReadme --> BackendDocs
RootReadme --> FrontendDocs
RootReadme --> DatabaseDocs
RootReadme --> AIDocs

RootSpec --> BackendSpec
RootSpec --> FrontendSpec
BackendDocs --> BackendSpec
FrontendDocs --> FrontendSpec
DatabaseDocs --> RootSpec
AIDocs --> RootSpec
@enduml
```

## Trạng Thái Hiện Tại

- Backend đã có core APIs và các API mở rộng đang được Frontend dùng: manual crawler refresh, history, related papers, duplicate/matching papers, ratings, notifications, notification SSE và topic trends.
- Database đã có cả schema core/advanced, pipeline tạo notification gộp theo topic, related papers, duplicate matching, summary batch, rating average và topic trend bằng AI/fallback.
- Frontend đã tích hợp các API chính với Backend: dashboard, search, topics, manual refresh, favorites, history, paper detail, related/matching, rating, notifications và trend.
- Phần còn thiếu chính hiện tại: forgot/reset password thật, UI sửa trực tiếp chủ đề đang theo dõi nếu vẫn muốn giữ luồng update, notes cho paper interaction và tài liệu sơ đồ ERD.
