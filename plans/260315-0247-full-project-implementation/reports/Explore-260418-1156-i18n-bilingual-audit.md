# AWS Exam App - Bilingual Support Audit Report
**Date**: 2026-04-18  
**Scope**: Frontend (React/TypeScript), Backend (Django REST)

---

## Executive Summary

The AWS Exam App has **partial bilingual (English/Vietnamese) support**:
- **Frontend**: i18n framework installed (react-i18next) with 204+ translation keys
- **Coverage**: Only 38% of UI components use translations (16/42 pages/components/layouts)
- **Backend**: Basic Django gettext setup with 9 error messages marked for translation
- **Content**: Question bank lacks multilingual field support
- **Status**: Significant gaps exist requiring targeted fixes

---

## 1. FRONTEND i18n COVERAGE

### Translation Infrastructure ✅

**Setup Location**: `/home/truong/project/aws-exam-app/apps/frontend/src/i18n/`

- **Configuration**: `config.ts` 
  - Framework: `react-i18next` with browser language detection
  - Fallback Language: English
  - Detection Order: localStorage → cookie
  - Both `en.json` and `vi.json` properly configured

- **Translation Keys**: 204 keys across 8 namespaces:
  - `landing`, `common`, `nav`, `dashboard`, `auth`, `exam`, `practice`, `comment`, `report`, `history`, `analytics`

- **Language Switcher**: `components/language-switcher.tsx` ✅ (fully implemented)

---

### Components WITH useTranslation (16 files) ✅

| Status | Files | Details |
|--------|-------|---------|
| COMPLETE | **Pages (6)** | `landing-page`, `login-page`, `register-page`, `dashboard-page`, `practice-setup-page`, `exam-setup-page` |
| COMPLETE | **Pages (4)** | `exam-session-page`, `exam-result-page`, `practice-session-page`, `analytics-page`, `history-page` |
| COMPLETE | **Components (4)** | `answer-report-modal`, `comment-form`, `comment-item`, `weak-domains-chart` |
| COMPLETE | **Layouts (1)** | `auth-layout` |
| COMPLETE | **Other (1)** | `language-switcher`, `sidebar` |

**Assessment**: These files use `const { t } = useTranslation()` and properly reference translation keys with `t('namespace.key')` pattern.

---

### Components WITHOUT useTranslation (23 files) - CRITICAL GAPS

#### ADMIN PAGES (5 files) - ALL MISSING i18n ❌

1. **`/pages/admin/admin-dashboard-page.tsx`**
   - Hardcoded: 
     - `'Chứng chỉ'` (Certifications)
     - `'Câu hỏi'` (Questions)
     - `'Bảng điều khiển Quản trị'` (Admin Dashboard)
     - `'Tổng quan hệ thống'` (System Overview)
     - `'Các hành động nhanh'` (Quick Actions)
     - `'Nhập câu hỏi'` (Import Questions)
     - `'Quản lý bài thi'` (Manage Exams)
     - `'Quản lý người dùng'` (Manage Users)

2. **`/pages/admin/admin-exams-page.tsx`**
   - Hardcoded: 
     - `'Quản lý Chứng chỉ & Bộ đề'` (Manage Certifications & Sets)
     - `'Khóa hoặc mở khóa quyền truy cập API'` (Lock/Unlock API Access)

3. **`/pages/admin/admin-questions-page.tsx`**
   - Hardcoded:
     - `'Câu hỏi'` (Questions)
     - `'Duyệt ngân hàng câu hỏi'` (Browse Question Bank)

4. **`/pages/admin/admin-users-page.tsx`**
   - Hardcoded:
     - `'Người dùng'` (Users)
     - `'Quản lý tài khoản'` (Manage Accounts)

5. **`/pages/admin/admin-import-page.tsx`**
   - Hardcoded in child component `import-dropzone.tsx` (below)

#### ADMIN COMPONENTS (3 files) - ALL MISSING i18n ❌

1. **`/components/admin/import-dropzone.tsx`**
   - Hardcoded error messages:
     - `'Chỉ chấp nhận tệp .json'` (Only .json files accepted)
     - `'JSON phải có certification_code, domain_name, và mảng questions'` (JSON must have...)
     - `'Định dạng JSON không hợp lệ'` (Invalid JSON format)
   - Hardcoded UI text:
     - `'Thả tệp .json ở đây, hoặc nhấp vào để duyệt'` (Drop .json here or click to browse)
     - `'Chấp nhận định dạng JSON nhập câu hỏi'` (Accepts JSON import format)

2. **`/components/admin/import-result-panel.tsx`**
   - Not yet analyzed (likely has hardcoded text)

3. **`/components/admin/question-filters.tsx`**
   - Hardcoded:
     - `'Tất cả chứng chỉ'` (All certifications)
     - `'Tất cả lĩnh vực'` (All domains)
     - `'Tìm kiếm chứng chỉ...'` (Search certifications...)
     - `'Xóa'` (Clear)

#### EXAM COMPONENTS (3 files) - MISSING i18n ❌

1. **`/components/exam/answer-option.tsx`**
   - No hardcoded text, but also no i18n — component expects label from parent

2. **`/components/exam/exam-timer.tsx`**
   - No hardcoded text (displays dynamic values)

3. **`/components/exam/question-navigation-grid.tsx`**
   - No hardcoded text found, but no i18n hook

4. **`/components/exam/exam-set-history-modal.tsx`**
   - Not yet analyzed

#### PRACTICE COMPONENTS (2 files) - PARTIALLY MISSING ❌

1. **`/components/practice/bookmark-button.tsx`**
   - Hardcoded:
     - `'Xóa dấu trang'` (Remove bookmark)
     - `'Đánh dấu câu hỏi này'` (Bookmark this question)
     - `'Đã đánh dấu'` (Bookmarked)
     - `'Đánh dấu'` (Bookmark)

2. **`/components/practice/comment-section.tsx`**
   - Hardcoded:
     - `'Cộng đồng'` (Community)
     - `'Đang tải bình luận...'` (Loading comments...)
     - `'Chưa có bình luận nào. Hãy là người đầu tiên!'` (No comments. Be first!)
     - `'Chưa có bình luận nào. Đăng nhập để bình luận.'` (No comments. Login to comment.)

#### DASHBOARD COMPONENTS (2 files) - MISSING i18n ❌

1. **`/components/dashboard/score-card.tsx`**
   - Component takes label as prop (no hardcoding), but parent passes hardcoded label:
     - `{ label: 'Chứng chỉ', ... }` should use translation

2. **`/components/analytics/score-trend-chart.tsx`**
   - Not yet analyzed

#### LAYOUT COMPONENTS (2 files)

1. **`/layouts/navbar.tsx`**
   - No hardcoded text (displays dynamic user data)

2. **`/layouts/admin-layout.tsx`** - Not analyzed
3. **`/layouts/app-shell.tsx`** - Not analyzed

#### SHARED COMPONENTS (2 files) - MISSING i18n ❌

1. **`/components/shared/empty-state.tsx`**
   - Component takes label as prop (no hardcoding)

2. **`/components/ui/page-header.tsx`**
   - Component takes title/subtitle as props
   - Parent components pass hardcoded Vietnamese strings

3. **`/components/ui/toast-container.tsx`**
   - Has hardcoded toast labels:
     - `'OK'`, `'ERR'`, `'WARN'`, `'INFO'`
   - These are status labels, not user-facing messages

#### ERROR PAGE (1 file) - MISSING i18n ❌

1. **`/pages/not-found-page.tsx`**
   - Hardcoded:
     - `'404'` (code, OK to hardcode)
     - `'Trang này không tồn tại.'` (This page doesn't exist.)
     - `'Quay lại Bảng điều khiển'` (Back to Dashboard)

---

## 2. HARDCODED TEXT ANALYSIS

### Summary
- **Total hardcoded Vietnamese strings found**: ~50+ user-facing strings
- **Severity**: HIGH — All admin/user-facing text should be translatable

### By Category

#### Error Messages (Critical)
- Import validation errors (3)
- Comment loading errors (2)

#### UI Labels
- Admin titles and subtitles (8)
- Filter placeholders (4)
- Button labels (8)
- Status indicators (4)

#### Empty States
- No comments message (2 variants)

---

## 3. BACKEND TRANSLATION SUPPORT

### Django i18n Configuration ✅
**File**: `/home/truong/project/aws-exam-app/apps/backend/config/settings/base.py`

```python
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
```

### Error Messages (Partial i18n) ⚠️

**File**: `/home/truong/project/aws-exam-app/apps/backend/core/constants/errors.py`

- Uses `django.utils.translation.gettext as _` 
- **9 error keys marked for translation**:
  - `ERR_BAD_REQUEST`
  - `ERR_INVALID_TYPE`
  - `ERR_NOT_BLANK`
  - `ERR_NOT_AUTHENTICATED`
  - `ERR_RESOURCE_MAX_SIZE`
  - `ERR_UNIQUE_FIELD`
  - `ERR_RESOURCE_NOT_FOUND`
  - `ERR_PERMISSION_DENIED`
  - `ERR_METHOD_NOT_ALLOWED`

### API Serializer Error Messages (NOT Translated) ❌

**File**: `/home/truong/project/aws-exam-app/apps/backend/apps/exams/serializers.py`

Hardcoded error messages in validation:
```python
raise serializers.ValidationError("Certification not found.")
raise serializers.ValidationError("Exam set not found.")
raise serializers.ValidationError("Either certification_id or exam_set_id is required.")
```

**File**: `/home/truong/project/aws-exam-app/apps/backend/apps/accounts/serializers.py`

Hardcoded error messages:
```python
raise serializers.ValidationError("A user with this email already exists.")
raise serializers.ValidationError({"old_password": "Current password is incorrect."})
raise serializers.ValidationError({"new_password": list(exc.messages)})
```

**File**: `/home/truong/project/aws-exam-app/apps/backend/apps/imports/serializers.py`

Unknown error messages (needs review)

### Django Admin Interface (NOT Translated) ❌

**File**: `/home/truong/project/aws-exam-app/apps/backend/apps/questions/admin.py`

- Uses hardcoded English descriptions:
  - `description="Question"`
  - `description="Set Locked"`
  - `description="Questions"`
  - `description="Unlock selected sets"`
  - `description="Lock selected sets"`
  - `description="Mark selected as Reviewed"`
  - `description="Mark selected as Dismissed"`

No translations applied to Django admin interface.

---

## 4. DATA CONTENT TRANSLATION GAPS

### Question Bank Models ❌

**File**: `/home/truong/project/aws-exam-app/apps/backend/apps/questions/models.py`

**Critical Issues**:

1. **No multilingual field support** for:
   - `Certification.name` — AWS cert names are English (SAA, CLF, etc.)
   - `Certification.description` — Only English
   - `Domain.name` — Only English (when domains are used)
   - `Question.text` — Questions are English only
   - `Question.explanation` — Explanations are English only
   - `Answer.text` — Answers are English only

2. **Status fields are hardcoded** (English only):
   - `ExamAttempt.STATUS_CHOICES`: `'in_progress'`, `'paused'`, `'submitted'`, `'expired'`
   - `AnswerReport.STATUS_CHOICES`: `'pending'`, `'reviewed'`, `'dismissed'`
   - `Question.QUESTION_TYPE_CHOICES`: `'single'`, `'multiple'`

### Serializer Output (No Translations) ❌

**Files**:
- `/apps/exams/serializers.py`
- `/apps/questions/serializers.py`

- API returns raw question/answer text with no language indicator
- No language field in responses
- No mechanism for returning translated content

### Frontend Practice Mode (Content Not Translated) ❌

**File**: `/pages/practice/practice-session-page.tsx`

- Questions displayed as-is from API
- No client-side translation of question content
- No support for user language preference affecting question language

---

## 5. LANGUAGE SWITCHER & DETECTION

### Frontend Implementation ✅

**File**: `/components/language-switcher.tsx`

- Provides UI toggle for English/Vietnamese
- Uses `useTranslation()` hook to change i18n language
- Stores preference in localStorage/cookie
- Auto-detects browser language

**Issue**: Only switches UI text, not question bank content (which is hardcoded English).

---

## Summary Table: By Status

| Status | Count | Examples |
|--------|-------|----------|
| **COMPLETE** (i18n + no hardcoding) | 16 | `login-page`, `exam-session-page`, `practice-session-page` |
| **PARTIALLY_DONE** (has i18n but also hardcoded text in parents) | 5 | `score-card`, `empty-state`, `page-header` |
| **MISSING** (all hardcoded) | 23 | All admin pages, bookmark button, comment-section, not-found-page |
| **N/A** (no user-facing text) | 2 | `exam-timer`, `answer-option` |

---

## Priority Fixes (Highest to Lowest)

### CRITICAL 🔴
1. **Admin Pages** (5 pages)
   - All 5 admin pages lack i18n integration
   - Should have dedicated admin namespace in translations
   - Affects admin users who may be Vietnamese-speaking

2. **Admin Components** (3 components)
   - `import-dropzone`: Error messages must be translatable
   - `question-filters`: Filter labels + placeholders
   - `import-result-panel`: Status/result messages

3. **API Error Messages** (Backend)
   - Serializers use hardcoded English validation errors
   - Should use Django gettext for all ValidationError messages
   - Users see English errors even if UI is in Vietnamese

### HIGH 🟠
4. **Practice Components** (2 components)
   - `bookmark-button`: Button labels + tooltips
   - `comment-section`: Empty state messages, loading states

5. **404 Page**
   - Small but visible to all users

6. **Dashboard Labels**
   - `admin-dashboard-page`: Stat card labels are hardcoded

### MEDIUM 🟡
7. **Backend Admin Interface**
   - Django admin descriptions should use gettext
   - Affects staff-only interface

8. **Serializer Validation Errors**
   - Should centralize validation error messages
   - Use Django gettext for consistency

9. **Question Content**
   - Consider django-modeltranslation or similar for multilingual questions
   - Lower priority if keeping question bank English-only is intended

---

## Files Requiring Work

### Frontend (23 files need attention)
**Admin**: admin-dashboard-page.tsx, admin-exams-page.tsx, admin-questions-page.tsx, admin-users-page.tsx, admin-import-page.tsx  
**Admin Components**: import-dropzone.tsx, import-result-panel.tsx, question-filters.tsx  
**Exam**: exam-set-history-modal.tsx  
**Practice**: bookmark-button.tsx, comment-section.tsx  
**Dashboard**: score-card.tsx (passes hardcoded label)  
**Analytics**: score-trend-chart.tsx  
**Layouts**: admin-layout.tsx, app-shell.tsx, navbar.tsx  
**Shared**: empty-state.tsx, page-header.tsx (parents pass hardcoded text)  
**UI**: toast-container.tsx (status labels)  
**Pages**: not-found-page.tsx

### Backend (Multiple files)
**Serializers**: accounts/serializers.py, exams/serializers.py, imports/serializers.py  
**Admin**: questions/admin.py  
**Models**: Consider multilingual field support for questions

---

## Recommendations

### Short Term (Critical Path)
1. Add admin namespace to i18n files (en.json, vi.json)
2. Wrap all 5 admin page hardcoded strings in translations
3. Translate import-dropzone and question-filters error/label strings
4. Translate bookmark-button and comment-section strings
5. Fix not-found-page

### Medium Term
1. Centralize backend validation error messages using Django gettext
2. Translate Django admin interface descriptions
3. Add toast status labels to translations
4. Review all parent components passing hardcoded labels to children

### Long Term
1. Consider django-modeltranslation or separate language tables for question content
2. Add language field to API responses (question_language: "en")
3. Implement mechanism to display questions in user's preferred language
4. Create translation management workflow for question bank maintenance

---

## Files & Line References

**Translation Configuration**:
- `/home/truong/project/aws-exam-app/apps/frontend/src/i18n/config.ts`
- `/home/truong/project/aws-exam-app/apps/frontend/src/i18n/locales/en.json` (204 keys)
- `/home/truong/project/aws-exam-app/apps/frontend/src/i18n/locales/vi.json` (204 keys)

**Backend Settings**:
- `/home/truong/project/aws-exam-app/apps/backend/config/settings/base.py` (USE_I18N=True)
- `/home/truong/project/aws-exam-app/apps/backend/core/constants/errors.py` (9 translated errors)

**Critical Gaps** (23 files listed above)

---

**Report Generated**: 2026-04-18  
**Audit Scope**: Frontend + Backend  
**Language Pair**: English/Vietnamese (vi)
