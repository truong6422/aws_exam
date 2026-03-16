# AWS Exam App – Project Specification

## 1. Mục tiêu dự án

Xây dựng một web application thi thử chứng chỉ AWS (ví dụ: SAA-C03, DVA-C02, CLF-C02).

Website phải có 2 chế độ:

1. **Exam Mode** – Thi thử giống thi thật.
2. **Practice Mode** – Luyện tập có giải thích.

Hệ thống phải hỗ trợ:

- Login / Logout
- Quản lý câu hỏi
- Thi thử giống AWS thật
- Luyện tập có giải thích chi tiết
- Lưu lịch sử bài thi
- Phân tích kết quả

---

## 2. Tech Stack yêu cầu

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- Redis
- Celery (nếu cần background job)

### Frontend

- React / Next.js
- TailwindCSS
- Zustand hoặc Redux

### Auth

- JWT Authentication

### Deployment

- Docker
- Nginx
- AWS EC2

---

## 3. Các loại chứng chỉ AWS cần hỗ trợ

Ví dụ:

- AWS Certified Cloud Practitioner (CLF-C02)
- AWS Certified Solutions Architect Associate (SAA-C03)
- AWS Certified Developer Associate (DVA-C02)

Mỗi chứng chỉ có:

- Nhiều **domain**
- Nhiều **questions**

---

## 4. Cấu trúc Database (Draft)

### 4.1. User

**User**

| Field       |
|-------------|
| id          |
| email       |
| password    |
| name        |
| created_at  |

---

### 4.2. Certification

**Certification**

| Field       |
|-------------|
| id          |
| name        |
| code        |
| description |

Ví dụ:

- name: `AWS Solutions Architect Associate`
- code: `SAA-C03`

---

### 4.3. Domain

**Domain**

| Field           |
|-----------------|
| id              |
| certification_id|
| name            |
| weight          |

Ví dụ:

- name: `Design Secure Architectures`

---

### 4.4. Question

**Question**

| Field            |
|------------------|
| id               |
| certification_id |
| domain_id        |
| question_text    |
| difficulty       |
| explanation      |
| multiple_correct |
| created_at       |

---

### 4.5. Answer

**Answer**

| Field       |
|-------------|
| id          |
| question_id |
| answer_text |
| is_correct  |
| explanation |

---

### 4.6. ExamAttempt

**ExamAttempt**

| Field            |
|------------------|
| id               |
| user_id          |
| certification_id |
| score            |
| total_questions  |
| correct_answers  |
| started_at       |
| finished_at      |
| mode             |

`mode` values:

- `exam`
- `practice`

---

### 4.7. ExamAttemptAnswer

**ExamAttemptAnswer**

| Field         |
|---------------|
| id            |
| attempt_id    |
| question_id   |
| selected_answer |
| is_correct    |

---

## 5. Chế độ thi thử (Exam Mode)

Mục tiêu: mô phỏng AWS exam thật.

Ví dụ **SAA-C03**:

- 65 câu
- 130 phút

Logic:

- Random câu hỏi
- Không hiện đáp án
- Không hiện giải thích
- Không biết đúng sai ngay
- Hết giờ tự submit

Sau khi submit hiển thị:

- Score
- Correct answers
- Review answers (xem lại từng câu + đáp án đúng/sai)

---

## 6. Chế độ luyện tập (Practice Mode)

User chọn:

- Certification
- Domain
- Difficulty

Sau mỗi câu hiển thị:

- Đáp án đúng
- Giải thích chi tiết
- Tại sao các đáp án khác sai

**Ví dụ:**

Question:

> Which AWS service provides a fully managed NoSQL database?

Answers:

- A. RDS
- B. DynamoDB
- C. Redshift
- D. Aurora

Hiển thị:

- Correct answer: **B**
- Explanation:
  - DynamoDB is a fully managed NoSQL database service.
- Why others are wrong:
  - RDS → relational database
  - Redshift → data warehouse
  - Aurora → relational database

---

## 7. API Backend (Draft)

### 7.1. Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 7.2. Certification

- `GET /api/certifications`
- `GET /api/certifications/{id}`

### 7.3. Questions

- `GET /api/questions`
- `GET /api/questions/{id}`

### 7.4. Practice

- `GET /api/practice/questions`
- `POST /api/practice/answer`

### 7.5. Exam

- Start exam: `POST /api/exam/start`
- Get exam questions: `GET /api/exam/{id}/questions`
- Submit exam: `POST /api/exam/{id}/submit`
- Get result: `GET /api/exam/{id}/result`

---

## 8. UI Pages (Draft)

### 8.1. Landing Page

Hiển thị:

- Start Practice
- Start Exam

### 8.2. Login Page

- email
- password
- login button

### 8.3. Dashboard

Hiển thị:

- Recent exams
- Progress
- Weak domains

### 8.4. Practice Page

Hiển thị:

- question
- answers
- submit
- explanation

### 8.5. Exam Page

Hiển thị:

- timer
- question navigation
- flag question
- submit exam

### 8.6. Result Page

Hiển thị:

- score
- correct answers
- wrong answers
- explanation

---

## 9. Logic Random Questions

**Exam Mode:**

- Random 65 questions
- Mix difficulty
- Mix domains

**Practice Mode:**

- Random theo domain

---

## 10. Admin Panel

Admin có thể:

- add question
- edit question
- import question from JSON

---

## 11. Import Questions (JSON)

Cho phép import JSON, ví dụ:

```json
{
  "question": "Which AWS service is used for object storage?",
  "answers": [
    { "text": "S3", "correct": true },
    { "text": "EBS", "correct": false },
    { "text": "EFS", "correct": false },
    { "text": "Glacier", "correct": false }
  ],
  "explanation": "S3 is object storage."
}
```

---

## 12. Feature nâng cao (Nice-to-have)

### 12.1. Analytics

Hiển thị:

- Weak domains
- Accuracy rate

### 12.2. Bookmark Question

User có thể:

- Save question
- Review later

### 12.3. AI Explanation

Tùy chọn:

- Generate explanation with AI

---

## 13. Performance

Yêu cầu:

- API response < 200ms
- Pagination
- Cache Redis

---

## 14. Security

Bắt buộc:

- JWT
- Rate limit
- CSRF protection

---

## 15. Docker

Cần có:

- Dockerfile
- docker-compose.yml

**Services:**

- django
- postgres
- redis
- nginx

---

## 16. Kết quả mong muốn

Output phải bao gồm:

- Full project structure
- Backend code
- Frontend code
- Database models
- API endpoints
- Docker setup

---

## 17. Coding Standards

Yêu cầu:

- Clean architecture
- Service layer
- Repository pattern
- Reusable components

---

## 18. Tham chiếu UI

Website mong muốn giống các trang:

- TutorialsDojo
- Whizlabs
- ExamTopics
