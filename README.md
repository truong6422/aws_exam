# AWS Exam App

Ứng dụng web luyện thi chứng chỉ AWS — Django REST API + React SPA.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Django 5.0 + Django REST Framework |
| Frontend | React 18 + Vite + TypeScript |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + Celery |
| Web Server | Nginx (reverse proxy + SSL) |
| App Server | Gunicorn |
| Containerization | Docker + Docker Compose |

## Cấu trúc thư mục

```
aws-exam-app/
├── apps/
│   ├── backend/        # Django project
│   └── frontend/       # React project
├── docker/
│   └── backend/        # Dockerfile backend
├── nginx/              # Dockerfile + config Nginx
├── docs/               # Tài liệu dự án
├── plans/              # Implementation plans
├── docker-compose.yml  # Production stack
├── Makefile            # Dev shortcuts
└── .env.example        # Template biến môi trường
```

## Bắt đầu phát triển

**Yêu cầu:** Python 3.12+, Node.js 20+, PostgreSQL 16, Redis 7

```bash
# 1. Cài dependencies
make venv
cd apps/frontend && npm install

# 2. Cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env với thông tin local

# 3. Chạy backend + frontend cùng lúc
make dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/django-admin/ |

## Các lệnh thường dùng

```bash
make migrate          # Chạy database migration
make makemigrations   # Tạo migration mới
make createsuper      # Tạo superuser
make test-backend     # Chạy test suite
make lint             # Kiểm tra code style
make shell            # Django interactive shell
```

## Triển khai

Pipeline CI/CD tự động qua **GitHub Actions** — push vào `master` sẽ build Docker image và deploy lên AWS EC2.

Chi tiết: [`docs/ci-cd-pipeline.md`](docs/ci-cd-pipeline.md)

## Biến môi trường

Xem [`env.example`](.env.example) để biết danh sách đầy đủ. Các biến quan trọng:

```env
SECRET_KEY=...
DEBUG=0
POSTGRES_PASSWORD=...
JWT_SECRET_KEY=...
```

> **Không bao giờ commit file `.env` lên repository.**
