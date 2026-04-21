# CI/CD Pipeline — AWS Exam App

## File liên quan

| File | Vai trò |
|------|---------|
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Định nghĩa toàn bộ pipeline CI/CD |
| [`docker/backend/Dockerfile`](../docker/backend/Dockerfile) | Build image Django (multi-stage: base / development / production) |
| [`nginx/Dockerfile`](../nginx/Dockerfile) | Build image Nginx (reverse proxy) |
| [`nginx/nginx.conf`](../nginx/nginx.conf) | Cấu hình routing, SSL, proxy |
| [`docker-compose.yml`](../docker-compose.yml) | Khai báo stack production trên EC2 |
| [`.env.example`](../.env.example) | Template biến môi trường — không chứa giá trị thật |

---

## Tổng quan

Pipeline chạy trên **GitHub Actions**, tự động build và deploy lên **AWS EC2** mỗi khi push vào nhánh `master`.

---

## Luồng hoạt động

```
  Developer
     │
     │  git push origin master
     ▼
┌────────────────────────────────────────────────────────────────┐
│                       GitHub Actions                           │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  JOB 1 · build-and-push                                 │  │
│  │                                                         │  │
│  │  1. Checkout source code                                │  │
│  │  2. Login ghcr.io  (GITHUB_TOKEN)                       │  │
│  │  3. Build docker/backend/Dockerfile  → production stage │  │
│  │  4. Build nginx/Dockerfile                              │  │
│  │  5. Push cả 2 image lên GHCR                           │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │ success                          │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │  JOB 2 · deploy                                         │  │
│  │                                                         │  │
│  │  1. Checkout code  (lấy docker-compose.yml)             │  │
│  │  2. Tạo .env  ←  GitHub Secret: ENV_CONFIG              │  │
│  │  3. tar(.env + docker-compose.yml) → deploy_files.tar.gz│  │
│  │  4. SCP → EC2: ~/aws-exam-app/                          │  │
│  │  5. SSH vào EC2:                                        │  │
│  │       tar -xzf && rm deploy_files.tar.gz                │  │
│  │       docker login ghcr.io                              │  │
│  │       docker compose pull    ← image mới từ GHCR        │  │
│  │       docker compose up -d   ← restart containers       │  │
│  │       docker image prune -af ← xóa image cũ            │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ SSH / Docker Compose
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     AWS EC2  (Production)                      │
│                                                                │
│   Internet                                                     │
│      │ :80/:443                                                │
│      ▼                                                         │
│  ┌───────┐     ┌──────────────────┐     ┌──────────────────┐  │
│  │ Nginx │────►│ Django + Gunicorn│────►│  PostgreSQL 16   │  │
│  └───────┘     │     :8000        │     └──────────────────┘  │
│                └──────────────────┘     ┌──────────────────┐  │
│                         └──────────────►│    Redis 7       │  │
│                                         └──────────────────┘  │
│            (tất cả giao tiếp qua internal Docker network)      │
└────────────────────────────────────────────────────────────────┘
```

**Image registry:**
```
ghcr.io/truong6422/aws-exam-be:latest     ← Django + Gunicorn
ghcr.io/truong6422/aws-exam-nginx:latest  ← Nginx + React SPA
```

