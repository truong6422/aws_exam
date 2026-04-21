# CI/CD Pipeline — AWS Exam App

## File liên quan

| File | Vai trò |
|------|---------|
| `.github/workflows/deploy.yml` | Định nghĩa toàn bộ pipeline CI/CD |
| `docker/backend/Dockerfile` | Build image Django (multi-stage: base / development / production) |
| `nginx/Dockerfile` | Build image Nginx (reverse proxy) |
| `nginx/nginx.conf` | Cấu hình routing, SSL, proxy |
| `docker-compose.yml` | Khai báo stack production trên EC2 |
| `.env.example` | Template biến môi trường — không chứa giá trị thật |

---

## Tổng quan

Pipeline chạy trên **GitHub Actions**, tự động build và deploy lên **AWS EC2** mỗi khi push vào nhánh `master`.

---

## Luồng hoạt động

```
git push → master
     │
     ▼
[Job 1] build-and-push                         (.github/workflows/deploy.yml)
  1. Checkout source code
  2. Login vào ghcr.io bằng GITHUB_TOKEN
  3. Build docker/backend/Dockerfile (target: production)
     → push ghcr.io/truong6422/aws-exam-be:latest
  4. Build nginx/Dockerfile
     → push ghcr.io/truong6422/aws-exam-nginx:latest
     │
     ▼ (chỉ chạy nếu Job 1 thành công)
[Job 2] deploy
  1. Tạo file .env từ GitHub Secret ENV_CONFIG
  2. Đóng gói: tar .env + docker-compose.yml → deploy_files.tar.gz
  3. SCP deploy_files.tar.gz lên EC2 (~/aws-exam-app/)
  4. SSH vào EC2, thực hiện:
       tar -xzf deploy_files.tar.gz
       docker login ghcr.io
       docker compose pull        ← kéo image mới từ GHCR
       docker compose up -d       ← restart containers với image mới
       docker image prune -af     ← xóa image cũ
```

---

## Stack trên EC2

```
Internet → Nginx (:443) → Django/Gunicorn (:8000)
                               ├── PostgreSQL 16
                               └── Redis 7
```

Tất cả services giao tiếp qua internal Docker network — chỉ Nginx expose ra ngoài.

---

## Phân tích

### Điểm tốt
- **Multi-stage Dockerfile** — image production gọn, không chứa dev tools
- **Health checks** — Postgres và Redis phải sẵn sàng trước khi Django khởi động
- **Secret an toàn** — `.env` lưu trong GitHub Secrets, không commit vào repo

### Hạn chế

| Vấn đề | Rủi ro |
|--------|--------|
| Không có staging — push master là deploy thẳng production | Cao |
| Chỉ dùng tag `:latest` — không rollback được về version cũ | Cao |
| Không có backup database tự động | Cao |
| Không có smoke test sau deploy — pipeline "xanh" dù service crash | Trung bình |
| Migration chạy trong container startup — lỗi sẽ khiến container loop restart | Trung bình |
| SSL Let's Encrypt phải gia hạn thủ công mỗi 90 ngày | Trung bình |
