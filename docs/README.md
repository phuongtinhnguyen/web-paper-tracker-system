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
ai/README.md           # Hướng dẫn AI summary/duplicate checker
```

Trạng thái hiện tại:

- Backend đã có core APIs.
- Database đã có cả schema core/advanced, pipeline tạo notification gộp theo topic và gọi Backend webhook để push SSE.
- Frontend đã dựng một số UI/call cho advanced APIs.
- Một số advanced APIs chưa có route Backend Express, gồm history, trends, related/matching papers và ratings. Notification APIs đã có ở Backend.
