# @shared/ui — SignTrustMap Design System & UI Primitives

Hệ thống Design Tokens và thư viện giao diện cơ sở (UI Primitives) dùng chung cho cả **Web (Community Portal)** và **Ops (Command Center)**.

> 📖 **Quy tắc & Tiêu chuẩn Kỹ thuật toàn hệ thống:** Tham chiếu bộ quy chuẩn Monorepo, API, RBAC và Clean Code tại [RULE.md](../../RULE.md).

---

## 🏛️ Kiến trúc 3 tầng quản lý Design Tokens

```
                ┌──────────────────────────────┐
                │ 3. UI Primitives (@shared/ui)│ <- Button, Card, Badge, Select, FilterBar
                ├──────────────────────────────┤
                │ 2. Tailwind v4 Theme (@theme)│ <- apps/web & apps/ops index.css
                ├──────────────────────────────┤
                │ 1. Tokens SSOT (TypeScript)  │ <- packages/ui/src/tokens/index.ts
                └──────────────────────────────┘
```

---

## 📍 Vị trí quản lý các thông số (Where & How)

| Nhóm thông số | Vị trí định nghĩa (SSOT) | Cách gọi trong TSX / CSS |
| :--- | :--- | :--- |
| **Bo góc (Border Radius)** | `packages/ui/src/tokens/index.ts` & `@theme` | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` |
| **Khoảng cách (Spacing & Gap)** | `packages/ui/src/tokens/index.ts` (4px/8px Grid) | `p-4`, `p-5`, `p-6`, `gap-4`, `gap-5`, `space-y-4`, `space-y-6` |
| **Chiều cao cố định (Heights)** | `packages/ui/src/tokens/index.ts` (`HEIGHTS`) | `Button size="sm"` (32px), `size="md"` (40px), `size="lg"` (48px) |
| **Thang Z-Index** | `packages/ui/src/tokens/index.ts` (`Z_INDEX`) | `Z_INDEX.modal` (50), `Z_INDEX.toast` (100), `Z_INDEX.sticky` (20) |
| **Bảng màu Semantic** | `packages/ui/src/tokens/index.ts` & `@theme` | `bg-[#007b8b]`, `text-[#00c4de]`, `bg-[#0A171C]` (dark-card) |

---

## 📐 Bảng quy chuẩn thông số chuẩn quốc tế

### 1. Thang Bo góc (Corner Radius Scale)

| Token | Kích thước | Class Tailwind | Đối tượng áp dụng |
| :--- | :---: | :---: | :--- |
| `RADIUS.sm` | `4px` | `rounded-sm` | Tooltip nhỏ, viền focus ring |
| `RADIUS.md` | `8px` | `rounded-md` hoặc `rounded-lg` | Badges, Chips, Sub-menu items |
| `RADIUS.lg` | `12px` | `rounded-xl` | **Nút bấm (Buttons), Ô nhập liệu (Inputs)** |
| `RADIUS.xl` | `16px` | `rounded-2xl` | **Thẻ thông tin (Cards), Khối Dashboard** |
| `RADIUS['2xl']` | `20px` | `rounded-2xl` | Bảng điều khiển lớn, Container chính |
| `RADIUS['3xl']` | `24px` | `rounded-3xl` | Cửa sổ Modals, Cụm Banner nổi bật |
| `RADIUS.pill` | `9999px` | `rounded-full` | Avatar, Chấm chỉ báo trạng thái (status dot) |

> ⚠️ **Quy tắc bắt buộc:** Tuyệt đối **không gõ số lẻ tùy tiện** như `rounded-[18px]`, `rounded-[28px]`. Toàn bộ bo góc phải thuộc thang trên.

---

### 2. Thang Chiều cao thành phần (Component Heights)

* **Button / Input Small**: `32px` (`h-8`) — Sử dụng trong thanh công cụ, Dense Table Actions.
* **Button / Input Medium (Mặc định)**: `40px` (`h-10`) — Sử dụng cho toàn bộ Form và Modal chuẩn.
* **Button Large**: `48px` (`h-12`) — CTA chính của Landing page, chuẩn chạm ngón tay Mobile.
* **Table Row Dense**: `40px` — Màn hình bảng mật độ cao trong Ops.
* **Table Row Standard**: `52px` — Màn hình danh sách người dùng.

---

### 3. Thang Z-Index (Chống xung đột lớp hiển thị với Bản đồ)

* `z-base`: `0`
* `z-dropdown`: `10`
* `z-sticky` (Header / Navbar cố định): `20`
* `z-drawer` / `sidebar`: `30`
* `z-backdrop` (Lớp làm mờ nền): `40`
* `z-modal`: `50`
* `z-toast`: `100`
* `z-tooltip`: `110`

---

## 🧩 Các Component cơ sở (UI Primitives)

### `<Button />`
```tsx
import { Button } from '@shared/ui'

<Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
  Thêm biển báo
</Button>
<Button variant="outline" size="sm" isLoading={isSubmitting}>
  Lưu nháp
</Button>
```

### `<Card />`
```tsx
import { Card } from '@shared/ui'

<Card variant="default" padding="md" radius="lg" interactive>
  <h3>Tiêu đề thẻ</h3>
  <p>Nội dung thẻ với bo góc và padding chuẩn 4px/8px grid.</p>
</Card>
```

### `<Badge />`
```tsx
import { Badge } from '@shared/ui'

<Badge variant="success" size="md" dot>Đang hoạt động</Badge>
<Badge variant="warning" size="sm">Cần kiểm duyệt</Badge>
```

### `<Avatar />` (Shadcn Fallback Pattern)
```tsx
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@shared/ui'

<Avatar size="md">
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
</Avatar>
```

