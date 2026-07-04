# MoCA Platform — UI design

> **Gate:** đọc file này trước **UI-5** (code).  
> **UI-0** = **UI-1** (legacy U0) — screen contract, không code.

---

## Brand

**Stitch — Functional Clarity** (Stitch project: React Question Form).  
Clinical minimal, elderly-friendly — **không** dùng Glass Editorial (ice_gate).

| Token | Value | File |
|-------|-------|------|
| Primary | `#2563eb` | `frontend/src/styles/stitch-tokens.css` |
| Secondary | `#00677c` | `index.css` `@theme` |
| Background / surface | `#f0f6ff` | stitch-tokens |
| Font | Geist, system-ui | `--stitch-font` |
| Mobile margin | `20px` | `--stitch-margin-mobile` |

Stitch map: `frontend/src/stitch/screens.json`  
Integration: [`docs/stitch-integration.md`](docs/stitch-integration.md)

**Elderly layer:** `stitch-elderly.css` — min touch 48px, text 16–18px, contrast cao — chỉ patient layout (`MocaPatientLayout`).

---

## App shell

| Region | Component | Patient | Doctor / Admin |
|--------|-----------|---------|----------------|
| Header | `MocaAppHeader` | Logo + title + Cài đặt + Đăng xuất | Tương tự / đơn giản hơn |
| Main | scroll hoặc `fitViewport` | `max-w-7xl`, breadcrumb optional | — |
| Bottom nav | `MocaBottomNav` | Mobile only (`md:hidden`) | Không |
| Layout wrapper | `MocaPatientLayout` | `elderly-layout` | — |

**Entry vs login**

| Route | Ai | Một việc |
|-------|-----|----------|
| `/entry` | Patient (public) | Giới thiệu + đăng nhập SĐT |
| `/login` | Doctor / Admin | Email + mật khẩu |
| `/signup` | Doctor | Đăng ký tài khoản mới |

---

## Screens (index)

| Screen | Route | Role | Primary task |
|--------|-------|------|--------------|
| Landing | `/entry` | patient | Hiểu app + login SĐT |
| Đăng nhập BS/Admin | `/login` | doctor, admin | JWT sau email/password |
| Trang chủ BN | `/patient` | patient | Chọn việc: test / kết quả / lịch / BS |
| Làm test MoCA | `/patient/test` | patient | Wizard 9 phần → submit |
| Kết quả | `/patient/results` | patient | Điểm tạm + chính thức |
| Lịch khám | `/patient/appointments` | patient | Danh sách hẹn (read-only) |
| Đổi bác sĩ | `/patient/doctors` | patient | Chọn BS mới |
| Cài đặt | `/patient/settings` | patient | Cập nhật hồ sơ |
| BS Dashboard | `/doctor` | doctor | Hàng chờ duyệt |
| BN của BS | `/doctor/patients` | doctor | Danh sách BN gán |
| Chấm điểm | `/doctor/reviews/:id` | doctor | Duyệt section → finalize |
| Admin Dashboard | `/admin` | admin | Tổng quan |
| Quản lý BS | `/admin/doctors` | admin | List / thêm BS / Show Information of doctor |

---

## Screen contracts (UI-0 / UI-1)

### `/entry` — Landing (patient)

**Layout:** header cố định · body scroll · footer CTA · bottom sheet SĐT (modal).

**Regions**
- Hero: tiêu đề MoCA + 3 bước (bắt đầu → làm từng phần → xem kết quả)
- CTA chính: **Bắt đầu** → mở sheet nhập SĐT
- Phụ: link doctor/admin → `/login`

**States:** validating SĐT · loading login · lỗi SĐT / API

**Copy:** tiếng Việt; không jargon EN.

---

### `/patient` — Trang chủ BN

**One job:** chọn **một** hành động tiếp theo.

**Layout**
- Section chào: eyebrow + `Chào mừng trở lại` (không dùng "Task Overview")
- Grid **2×2** cards (touch ≥48px):

| Card | Route | Icon tone | Desc |
|------|-------|-----------|------|
| Làm test MoCA | `/patient/test` | primary | Bài kiểm tra 9 phần |
| Kết quả | `/patient/results` | secondary | Điểm tạm & chính thức |
| Lịch khám | `/patient/appointments` | surface-high | Lịch hẹn sắp tới |
| Đổi bác sĩ | `/patient/doctors` | surface-high | Bác sĩ phụ trách |

- `fitViewport`: không scroll main khi đủ chỗ
- **Dev only:** dòng health API — ẩn khi `import.meta.env.PROD`

**Settings:** không card riêng — vào qua icon **Cài đặt** trên header (`/patient/settings`).

---

### `/patient/test` — Wizard MoCA

**Layout:** progress · câu hỏi · CTA Tiếp / Quay lại · optional timer.  
**States:** in-progress (local) · submitting · success “đã gửi chờ duyệt” · error.  
**Stitch refs:** `mocaNamingDrawing`, `mocaClock`, `mocaMemory` trong `screens.json`.

---

### `/patient/results` — Kết quả

**Layout:** list phiên hoặc empty state.  
**States**
- Empty: **Chưa có bài kiểm tra** (`emptyTests` Stitch)
- Loading: skeleton card
- Row: điểm + badge **Chờ bác sĩ duyệt** (amber) hoặc chính thức

**Copy:** **Kết quả tạm tính** / **Kết quả chính thức**

---

### `/patient/appointments` — Lịch khám

**Layout:** list card theo ngày.  
**Empty:** **Chưa có lịch hẹn**

---

### Bottom nav (mobile patient)

| Tab | Route | Label (VI) |
|-----|-------|------------|
| Home | `/patient` | **Trang chủ** (không "Assessment") |
| Bác sĩ | `/patient/doctors` | Bác sĩ |
| Kết quả | `/patient/results` | Kết quả |
| — | logout | Thoát |

Lịch khám: chỉ từ home grid (không tab bottom).

---

### `/login` — Doctor / Admin

**Layout:** centered form trong card `surface-container-lowest`, max-w-md.  
**Fields:** email, password, show/hide.  
**CTA row:** **Đăng nhập** (primary) + **Đăng ký** (secondary, cạnh nhau).  
**Copy:** Assessment Pro header; lỗi **Email hoặc mật khẩu không đúng.**

---

### `/signup` — Đăng ký bác sĩ

**Layout:** cùng shell với `/login` — card centered.  
**Fields:** họ tên, email, mật khẩu, chuyên khoa (optional), CCHN (optional).  
**States:** validating · submitting · lỗi 409 (email trùng) · lỗi API.  
**Link:** Đã có tài khoản? → `/login`

---

### `/doctor` — Dashboard

**One job:** thấy hàng chờ review nhanh.  
**Layout:** queue list + link patients.  
**Badge:** pending count nếu có.

---

### `/doctor/reviews/:id` — Chấm điểm

**Layout:** patient info · section scores · drawing/audio preview · finalize CTA.

---

## Global states

| State | Pattern |
|-------|---------|
| Empty | Illustration + một dòng + optional CTA |
| Loading | skeleton, không flash trắng |
| Error | `QueryState` — thử lại |
| Pending review | badge amber **Chờ bác sĩ duyệt** |

---

## Data & security (UI constraints)

- JWT → `Authorization: Bearer`; 401 → logout → `/entry` hoặc `/login`
- Patient: login **SĐT**; doctor/admin: **email + password**
- Điểm **0–30**; `PENDING_REVIEW` = tạm, `FINALIZED` = chính thức
- React Query + Zustand: [`docs/frontend-architecture.md`](docs/frontend-architecture.md)
- Entity map: [`docs/entity-design.md`](docs/entity-design.md)

---

## Drift register → UI-5 backlog

| P | Screen | Gap | Slice | Status |
|---|--------|-----|-------|--------|
| P1 | `/patient` | Thiếu card Lịch khám (3/4 cards) | `PatientHomePage` MENU | done |
| P1 | `/patient` | EN "Task Overview" | đổi **Tổng quan** | done |
| P2 | `/patient` | Health API lộ prod | `import.meta.env.DEV` | done |
| P2 | bottom nav | EN "Assessment" | **Trang chủ** | done |
| P3 | brand doc | design ghi `#4f46e5` | đã sync `#2563eb` ở trên | done |

---

## UI-2 — Who · Task · Platform · Constraints

> Read-only spec. Tiếp: **UI-3** structure · **UI-4** visual · **UI-5** one slice.

### Personas

| Role | Who | Limits |
|------|-----|--------|
| Patient | Cao tuổi, ít quen tech | Chữ lớn, ít bước, không mất bài đang làm |
| Doctor | BS lâm sàng giữa ca | Queue + điểm tạm nhanh |
| Admin | Nội bộ | Form đơn giản |

### Platform

Web SPA · React 19 + Vite · mobile-first · `VITE_USE_MOCK` · Stitch tokens · copy VI.

### WF / UC prompt

```text
@DuyLongSkills WF-0 + UI-2 — [feature]. story.
```

```text
@DuyLongSkills UI-3 — [screen]: regions + component tree. no code.
```

```text
@DuyLongSkills UI-5 — P1 PatientHomePage: 4-card grid. improve_little.
```

---

## Learn log

- 2026-07-01 — UI-0: screen contract + drift register = map trước khi sửa code.
