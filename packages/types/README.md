# @shared/types — SignTrustMap Shared Types & Domain Contracts

Hệ thống định nghĩa kiểu dữ liệu (TypeScript Interfaces, Types, DTOs, Enums) dùng chung giữa **Web Portal** (`apps/web`) và **Ops Portal** (`apps/ops`).

---

## 🎯 Mục đích & Nguyên tắc cốt lõi

1. **Single Source of Truth (SSOT) cho Dữ liệu:**
   - Mọi cấu trúc dữ liệu trao đổi giữa các ứng dụng hoặc nhận từ API Backend (Auth, User, Catalog, Review, Survey) phải được định nghĩa tại đây.
   - Tuyệt đối **không copy-paste** hay định nghĩa lại kiểu trùng lặp trong từng ứng dụng con (`apps/`).

2. **Thuần túy TypeScript (Zero Runtime Dependencies):**
   - Package này chỉ chứa mã TypeScript thuần túy (`.ts`), không chứa logic runtime, không phụ thuộc vào React, DOM hay bất kỳ thư viện bên ngoài nào.
   - Đảm bảo tốc độ build cực nhanh và không làm tăng bundle size của các ứng dụng tiêu thụ.

3. **Chuẩn hóa TSDoc 100%:**
   - Mọi interface, type alias, enum và từng trường dữ liệu quan trọng đều phải có chú thích TSDoc rõ ràng, giải thích ngữ cảnh nghiệp vụ và quy ước định dạng dữ liệu.

---

## 📂 Cấu trúc thư mục

```
packages/types/
├── src/
│   ├── auth.ts          # Định nghĩa User, UserRole, AuthTokens, LoginRequest/Response
│   └── index.ts         # Single Entrypoint re-export toàn bộ kiểu dữ liệu
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Cách sử dụng trong `apps/web` và `apps/ops`

Import trực tiếp từ `@shared/types` thông qua npm/pnpm workspace:

```typescript
import type { User, UserRole, AuthTokens, LoginResponse } from '@shared/types'

// Sử dụng trong context, service hoặc component
const handleLoginSuccess = (response: LoginResponse) => {
  const { user, tokens } = response
  // user có đầy đủ autocomplete và type-safety
}
```

---

## 📖 Quy chuẩn Hệ thống
Mọi quy tắc kiến trúc, quy chuẩn code và tiêu chuẩn kỹ thuật toàn hệ thống, vui lòng tham chiếu tại:
👉 **[RULE.md](../../RULE.md)**
