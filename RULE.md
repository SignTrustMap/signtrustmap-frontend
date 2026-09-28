# QUY TẮC PHÁT TRIỂN DỰ ÁN (PROJECT RULES & CONVENTIONS)
> **SignTrustMap Frontend** — Hiến pháp kỹ thuật và bộ quy chuẩn toàn diện về Kiến trúc Monorepo, Ranh giới Workspace, Design System, Type Safety, TSDoc, API, Giao diện (UI/UX), Bảo mật RBAC và Đa ngôn ngữ (i18n) để duy trì tính nhất quán, bảo mật và chất lượng mã nguồn cao nhất cho toàn bộ dự án.

---

## 1. KIẾN TRÚC MONOREPO & RANH GIỚI WORKSPACE (MONOREPO BOUNDARIES)

1. **Cấu trúc Ứng dụng & Gói Dùng Chung (Apps & Shared Packages):**
   - Dự án được tổ chức theo kiến trúc Monorepo chuẩn công nghiệp:
     - `apps/web`: Cổng thông tin công cộng (**Community Portal**) dành cho người dùng, người khảo sát và tài xế.
     - `apps/ops`: Trung tâm chỉ huy (**Ops Command Center**) dành cho Nhân viên vận hành (Staff) và Quản trị viên (Admin).
     - `packages/types`: Gói hợp đồng kiểu dữ liệu chung (**@shared/types**).
     - `packages/ui`: Thư viện Design Tokens và thành phần giao diện cơ sở (**@shared/ui**).
     - `packages/map`: Nền tảng bản đồ Leaflet, thuật toán GIS & Collision Thinning dùng chung (**@shared/map**).

2. **Nguyên tắc Ranh giới Nghiêm ngặt (Zero Cross-App Dependency):**
   - **Tuyệt đối CẤM** `apps/web` import mã nguồn, components hoặc kiểu dữ liệu trực tiếp từ `apps/ops` và ngược lại.
   - Bất kỳ đoạn mã, kiểu dữ liệu (types), tiện ích (utils) hoặc thành phần giao diện (UI primitives) nào cần dùng chung giữa hai ứng dụng **BẮT BUỘC** phải được đưa vào thư mục `packages/`.
   - Mỗi ứng dụng trong `apps/` phải có tệp `vite.config.ts`, cấu hình môi trường `.env`, router và điểm khởi chạy độc lập.

---

## 2. QUY CHUẨN DESIGN TOKENS & UI PRIMITIVES (@shared/ui)

1. **Single Source of Truth (SSOT) cho Thống số Giao diện:**
   - Mọi thông số về Bo góc (`RADIUS`), Khoảng cách (`SPACING`), Chiều cao (`HEIGHTS`), Bảng màu (`COLORS`) và Thứ tự lớp hiển thị (`Z_INDEX`) đều được quản lý tập trung duy nhất tại `packages/ui/src/tokens/index.ts` và ánh xạ vào biến CSS/Tailwind `@theme` tại `index.css` của từng ứng dụng.
   - Tài liệu chi tiết và ví dụ tra cứu: 👉 [packages/ui/README.md](packages/ui/README.md).

2. **Nghiêm cấm tuyệt đối Giá trị tùy tiện (Zero Magic Values):**
   - **CẤM** gõ số lẻ tùy tiện trong class Tailwind:
     - ❌ `rounded-[18px]`, `rounded-[22px]`, `rounded-[30px]`
     - ❌ `gap-[15px]`, `p-[18px]`, `m-[22px]`
     - ❌ `h-[38px]`, `h-[42px]`
   - Toàn bộ giao diện phải tuân theo thang chuẩn hóa:
     - **Bo góc (Corner Radius):** `rounded-sm` (4px), `rounded-md` (8px), `rounded-xl` (12px - Buttons/Inputs), `rounded-2xl` (16px - Cards/Panels), `rounded-3xl` (24px - Modals/Hero Banners), `rounded-full` (Pill/Badges/Avatars).
     - **Khoảng cách (Spacing Grid):** Tuân thủ hệ thống lưới **4px / 8px Grid** (`p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `gap-2`, `gap-4`, `gap-6`).
     - **Chiều cao cố định (Heights):** Small (`h-8` = 32px), Medium mặc định (`h-10` = 40px), Large (`h-12` = 48px), Table Row (`h-10` = 40px hoặc `h-13` = 52px).
     - **Thang Z-Index:** `z-0` (Bản đồ Leaflet), `z-10` (Dropdown), `z-20` (Sticky Navbar), `z-30` (Sidebar), `z-40` (Backdrop), `z-50` (Modal), `z-100` (Toast).

3. **Bắt buộc sử dụng Thư viện Thành phần Cơ sở (UI Primitives):**
   - Ưu tiên sử dụng các component chuẩn hóa từ `@shared/ui` (`<Button>`, `<Card>`, `<Badge>`, `<Pagination>`, `<PageHeader>`, `<DataFilterBar>`) thay vì tự tạo lại các nút bấm hoặc thẻ div thủ công.

---

## 3. QUY CHUẨN KIỂU DỮ LIỆU & TYPE SAFETY (@shared/types)

1. **Triệt tiêu Trùng lặp Kiểu dữ liệu (Zero Duplicate Types):**
   - Tuyệt đối không copy-paste hoặc định nghĩa lại các interface/type giữa các app (như `User`, `UserRole`, `AuthTokens`, `LoginResponse`).
   - Mọi Domain Models, Data Transfer Objects (DTOs), API Request/Response payloads dùng chung bắt buộc nằm tại `packages/types/src/` và export qua `packages/types/src/index.ts`.
   - Tài liệu chi tiết: 👉 [packages/types/README.md](packages/types/README.md).

2. **Nguyên tắc Pure TypeScript:**
   - Package `packages/types` phải thuần túy TypeScript, không chứa logic thực thi runtime, không phụ thuộc vào React hay DOM APIs.

---

## 4. QUY TẮC GIỚI HẠN ĐỘ DÀI FILE & PHÂN RÃ COMPONENT (COMPONENT DECOMPOSITION)

1. **Ngưỡng Độ dài File Tiêu chuẩn (File Length Budget):**
   - Độ dài lý tưởng cho một component/view là **100 – 250 dòng code**.
   - **Ngưỡng cảnh báo đỏ:** Khi một component hoặc trang vượt quá **350 – 400 dòng code**, lập trình viên **bắt buộc** phải phân rã thành các subcomponents chuyên biệt.

2. **Mô hình Phân rã Subcomponent theo Tính năng:**
   - Tổ chức các subcomponent trực tiếp trong `src/features/<feature-name>/components/`.
   - Ví dụ kiến trúc phân rã chuẩn (như module `Catalog`):
     - `CatalogPage.tsx` (Trang chính làm Orchestrator: ~250–300 dòng, chỉ giữ hook state, lọc dữ liệu, và kết nối subcomponents).
     - `components/CatalogDetailModal.tsx` (Modal xem chi tiết biển báo).
     - `components/CatalogGridView.tsx` (Chế độ xem dạng lưới thẻ).
     - `components/CatalogTableView.tsx` (Chế độ xem dạng bảng chi tiết).
     - `components/CreateSignModal.tsx` / `ProposeSignModal.tsx` (Modal tạo/đề xuất biển báo).
   - Mỗi subcomponent chỉ đảm nhận một trách nhiệm duy nhất (Single Responsibility Principle - SRP), giúp dễ đọc, dễ viết Unit Test và bảo trì lâu dài.

---

## 5. TIÊU CHUẨN TSDOC & CLEAN CODE (ZERO NOISE COMMENTS)

1. **Chuẩn hóa TSDoc Quốc tế:**
   - 100% các custom hooks, hàm tiện ích (utils), domain interfaces và UI Primitives export công khai phải được chú thích bằng định dạng **TSDoc** chuẩn (`/** ... */`).
   - Sử dụng các thẻ TSDoc chính xác:
     - `@param`: Mô tả ý nghĩa, ràng buộc và đơn vị tính của tham số.
     - `@returns`: Mô tả kết quả trả về.
     - `@example`: Cung cấp code mẫu trực quan khi hàm phức tạp.

2. **Nghiêm cấm Comment Rác / Comment Hiển nhiên (Zero Noise Comments):**
   - ❌ **CẤM:** Viết chú thích dịch lại tên biến/hàm hoặc mô tả điều ai cũng thấy bằng mắt thường:
     - *Ví dụ rác:* `// Khai báo state isLoading`, `// Hàm này dùng để render giao diện`, `// Import các thư viện React`.
   - **Quy tắc vàng:** Comment kỹ thuật chỉ được viết để giải thích **LÝ DO (Why)** — bối cảnh nghiệp vụ, quyết định kiến trúc, hoặc workaround đặc thù — tuyệt đối không giải thích **CÁI GÌ (What)** khi code tự nó đã rõ ràng.

---

## 6. QUY TẮC DỮ LIỆU & GỌI API (API & DATA ARCHITECTURE)

1. **Tách biệt dữ liệu mẫu (Mock Data Isolation):**
   - Tuyệt đối **không** viết mock data inline trực tiếp bên trong các file component hay file trang (`pages/`, `components/`).
   - Mọi dữ liệu mẫu phải được tổ chức thành các file riêng trong thư mục `src/data/` (ví dụ: `mockReview.ts`, `mockCatalog.ts`, `mockSurvey.ts`, `mockProfile.ts`, `mockMapSigns.ts`).
   - Mỗi file mock data phải export rõ ràng:
     - Các **TypeScript Interfaces/Types** định nghĩa cấu trúc dữ liệu.
     - Dữ liệu mảng/đối tượng mẫu chuẩn hóa.
   - Thư mục `src/data/index.ts` đóng vai trò là single entrypoint để re-export tất cả types và mock data.

2. **Chuẩn hóa tích hợp API:**
   - Dữ liệu mock phải mô phỏng chính xác payload và response từ REST API/tài liệu đặc tả.
   - Cấu trúc dữ liệu phải sẵn sàng để thay thế bằng các hook gọi API thực tế (`services/`, `api/`, `tanstack-query`) mà không làm xáo trộn giao diện.
   - Xử lý đầy đủ các trạng thái của dữ liệu: `Loading` (skeleton/spinner), `Success`, `Error` (thông báo lỗi thân thiện), và `Empty State` (trạng thái danh sách trống, kèm hình minh họa/thông điệp khích lệ).

3. **Chuẩn hóa Tầng Giao vận & Mạng (Axios Singleton & Zero Raw Fetch):**
   - Tuyệt đối **không** dùng hàm `fetch()` trực tiếp rải rác trong các file nghiệp vụ hoặc service.
   - 100% các request mạng phải thông qua **Axios Instance Singleton** (`apiClient` hoặc `edgeApiClient`).
   - Cấu hình chuẩn cho Axios Instance:
     - `baseURL` lấy từ `env.apiBaseUrl` (hoặc `AIOPS_BASE_URL`).
     - Timeout tiêu chuẩn 15.000ms – 20.000ms.
     - Headers mặc định (`Content-Type: application/json`, `Accept: application/json`).
     - Request Interceptor: Tự động đính kèm `Authorization: Bearer <token>` từ Storage nếu có.
     - Response Interceptor: Tự động unwrap `response.data`.

4. **Cơ chế Quản lý Token & Xử lý 401 Unauthorized (Event-Driven Soft Redirect):**
   - Xử lý refresh token tự động với cờ `_retry` khi gặp HTTP 401.
   - Khi refresh token thất bại hoặc phiên đăng nhập hết hạn:
     - Xóa các token lưu trữ (`stm_access_token`, `stm_refresh_token`).
     - Tuyệt đối **không** dùng `window.location.href = '/login'` gây hard reload (làm mất sạch toàn bộ in-memory state của React).
     - Bắt buộc kiểm tra xem request có header `Authorization` (protected route) hay không. Nếu có, phát sự kiện custom: `window.dispatchEvent(new CustomEvent('auth:unauthorized'))`.
     - Tầng `AuthContext` lắng nghe sự kiện này để reset state mềm và điều hướng người dùng mượt mà qua React Router. Các API công cộng (public request) không được phép kick văng người dùng khách.

5. **Quy tắc Tầng Dịch vụ Nghiệp vụ (Functional Service Objects):**
   - 100% các service trong `src/api/services/` phải được viết dưới dạng **Functional Object** (`export const [name]Service = { ... }`), tuyệt đối không dùng `class` tĩnh:
     - **Tối ưu hóa Tree-shaking:** Bundler (Vite/Rollup) dễ dàng phân tích và loại bỏ dead-code khi build production.
     - **Tương thích hoàn hảo với TanStack Query (React Query) / SWR:** Dễ dàng truyền trực tiếp các hàm async vào `queryFn: () => userService.getUsers()` mà không bị ràng buộc ngữ cảnh `this`.
     - **Codebase đồng nhất:** Loại bỏ cú pháp hướng đối tượng rườm rà không cần thiết trong React hiện đại.

---

## 7. QUY TẮC GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX DESIGN)

1. **Thẩm mỹ & Màu sắc (Color Palette & Dark/Light Theme):**
   - Dự án hỗ trợ cả **Dark Mode** (mặc định cho tech/web workspace) và **Light Mode**:
     - **Dark Mode**: Nền sâu `#030708`, card/panel `#061417` hoặc `#071317`, viền `border-white/10`, màu nhấn neon cyan `#00c4de`, emerald `#10b981`, amber `#f59e0b`.
     - **Light Mode**: Nền dịu `#F8F7F7`, card/panel `bg-white`, viền `#E8E4E3` hoặc `border-gray-200`, màu nhấn teal đậm `#007b8b`, chữ đen xám tương phản cao `#111827`.
   - Độ tương phản chữ: Chữ luôn rõ ràng, dễ đọc, không dùng màu xám quá nhạt trên nền trắng hoặc xám quá tối trên nền đen.

2. **Quy tắc hiển thị Bản đồ (Map & Leaflet Layers):**
   - **Xử lý z-index tuyệt đối:** Bản đồ Leaflet luôn phải được đặt trong vùng chứa có class `relative isolate z-0` hoặc z-index thấp, tuyệt đối không được che đè lên Navbar (`z-20`), Dropdown menu (`z-10`) hoặc Modal popup (`z-50`).
   - Giữ lại đầy đủ attribution OpenStreetMap theo quy định.

3. **Quy chuẩn thiết kế Modal (Modal Consistency):**
   - Mọi popup/modal nghiệp vụ (như `CatalogDetailModal`, `CreateSignModal`, `SurveyDetailModal`) phải tuân theo cấu trúc chuẩn:
     - **Header:** Chứa hệ thống tag/badge trạng thái, tiêu đề lớn in đậm, subtitle có icon thương hiệu (`Sparkle`, `TrafficSignal`...), và nút đóng `X`.
     - **Body:** Các section thông tin được đóng gói trong card bo tròn `rounded-2xl` với nền mờ nhẹ.
     - **Footer:** Nút phụ (Hủy / Đóng) đặt bên trái, nút hành động chính (Gửi / Xác nhận / Phê duyệt) đặt bên phải với màu sắc và shadow nổi bật.
     - Hỗ trợ đóng modal khi bấm phím `Esc` hoặc bấm ra ngoài overlay.

4. **Chuẩn hóa Phân trang (Pagination Standard):**
   - Tất cả các danh sách có nhiều trang (Lịch sử khảo sát, Lịch sử duyệt, Bảng giao dịch, Danh sách biển báo...) phải dùng chung component `Pagination.tsx` (`@shared/ui`).
   - Đồng bộ số lượng item trên mỗi trang và hiển thị rõ ràng `Trang X / Y` kèm các nút chuyển trang đầu/cuối/trước/sau.

5. **Tối ưu hóa Thao tác Bàn phím (Keyboard Accessibility & Hotkeys):**
   - Các màn hình mang tính chất thẩm định dữ liệu khối lượng lớn (như **Reviewer Workspace**) bắt buộc hỗ trợ phím tắt (`A`: Duyệt, `R`: Từ chối, `C`: Sửa nhãn, `F`: Cắm cờ, `Mũi tên`: Chuyển ca...).
   - Hiển thị gợi ý phím tắt trực quan dạng thẻ `<kbd>` ngay trên các nút bấm.
   - Khi focus vào ô nhập text (`input`, `textarea`), phím tắt duyệt phải tạm thời bị vô hiệu hóa để tránh bấm nhầm.

6. **Chuẩn hóa Tiêu đề & Bố cục Đầu trang (PageHeader Standard):**
   - 100% các trang nghiệp vụ (cả Staff lẫn Admin) bắt buộc dùng chung component `PageHeader.tsx` (`@shared/ui`).
   - Tuyệt đối không tự viết thẻ `<h1>` riêng rẽ với kích cỡ font lệch nhau. Tiêu chuẩn kiểu chữ thống nhất cho toàn bộ hệ thống là: `text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight`.
   - Giữ tiêu đề tối giản và tinh gọn. Các nút thao tác cấp trang (Lưu, Xuất tệp, Tạo mới...) phải được truyền qua prop `actions` để hiển thị thẳng hàng ở góc phải.

7. **Chuẩn hóa Bộ lọc & Bộ chọn Thống nhất (DataFilterBar & CustomSelect Standard):**
   - Mọi thanh tìm kiếm & lọc dữ liệu trên danh sách/bảng nghiệp vụ bắt buộc dùng chung component `DataFilterBar.tsx` (`@shared/ui`).
   - Tuyệt đối **không** dùng thẻ `<select>` gốc của trình duyệt (vốn bị lỗi xám xịt và vỡ phong cách trên Dark Mode), bắt buộc sử dụng component `CustomSelect` có theme styling đồng nhất.

8. **Chuẩn hóa Màn hình Lỗi Toàn cục (Global Error Canvas: 403 & 404):**
   - Tuyệt đối **không** nhốt nội dung lỗi vào trong các ô hộp nhỏ cô đơn giữa màn hình trắng.
   - Áp dụng bố cục **Open Hero Canvas** tràn màn hình tự nhiên giữa Navbar và Footer (`min-h-[calc(100vh-140px)]`):
     - Nền địa hình 3D Wireframe với spotlight, radial glow và fade gradient mượt mà.
     - Chữ số lỗi **`403`** / **`404`** kích thước lớn (`text-8xl sm:text-9xl md:text-[11rem] font-extrabold`), phủ dải màu chuyển sắc gradient đồng nhất với chữ **"Trust"** của trang chủ.
     - Nút điều hướng bo tròn dạng viên thuốc (`rounded-full px-8 py-3.5`).
     - Thông tin tối giản, tập trung vào giải pháp cho người dùng.

---

## 8. QUY TẮC ĐA NGÔN NGỮ & BẢN DỊCH (I18N CONVENTIONS)

1. **Tiêu chuẩn 100% i18n (Zero Hardcoded Strings):**
   - Tuyệt đối **không** viết cứng (hardcode) chuỗi văn bản bằng tiếng Việt hay tiếng Anh trong code TSX/JSX.
   - Mọi chuỗi hiển thị đều phải qua hàm `t('namespace.key')` của `react-i18next`.

2. **Duy trì tính đối xứng 1:1 giữa các tệp ngôn ngữ (Locale Parity):**
   - Hệ thống sử dụng 5 file ngôn ngữ chuẩn đặt tại `src/locales/{vi,en}/`:
     - `common.json`: Chứa các từ dùng chung, header, footer, modal, reviewer, survey studio, auth, bộ lọc, bảng dữ liệu.
     - `product.json`: Chứa nội dung trang giới thiệu giải pháp, tính năng, mini-map.
     - `home.json`: Chứa nội dung trang chủ, hero section, CTA.
     - `legal.json`: Chứa điều khoản bảo mật, quyền riêng tư, cam kết dịch vụ.
     - `docs.json`: Chứa tài liệu hướng dẫn kỹ thuật và tích hợp.
   - **Quy tắc bắt buộc:** Bất kỳ khi nào bổ sung một key mới vào file tiếng Việt (`vi`), **phải lập tức thêm key tương ứng** vào file tiếng Anh (`en`) và ngược lại. Không được phép để xảy ra tình trạng lệch key giữa 2 ngôn ngữ.

3. **Nguyên tắc dịch thuật tiếng Việt tự nhiên & thông dụng:**
   - Dịch nghĩa tự nhiên, mạch lạc, dễ hiểu trong ngữ cảnh giao thông và phần mềm bản đồ.
   - **Cho phép giữ nguyên các thuật ngữ tiếng Anh phổ biến:** Nếu trong tiếng Việt từ đó ít được sử dụng, xa lạ hoặc từ tiếng Anh đã quá quen thuộc với người dùng công nghệ, hãy giữ nguyên từ tiếng Anh (`Crop`, `Context`, `Credits`, `Track ID`, `GPS`, `YOLO`, `Hotkeys`, `Live View`, `OSM`).

4. **Quy tắc đặt tên key (Key Naming Convention):**
   - Đặt tên theo dạng `snake_case` có tiền tố phân nhóm chức năng:
     - Nút bấm: `btn_approve`, `btn_reject`, `btn_cancel`
     - Nhãn form: `lbl_name`, `lbl_category`, `lbl_coords`
     - Placeholder: `ph_search`, `ph_notes`
     - Thông báo Toast: `toast_success`, `toast_error`
     - Thông báo lỗi: `err_required`, `err_invalid_format`

---

## 9. QUY TẮC CẤU TRÚC THƯ MỤC THEO TÍNH NĂNG (FEATURE-DRIVEN ARCHITECTURE)

1. **Mô hình tổ chức Feature-Based thống nhất (Đồng bộ Web & Ops):**
   - Áp dụng mô hình Feature-Driven chuẩn công nghiệp cho cả `apps/web` và `apps/ops`:
   - Mọi tính năng nghiệp vụ được đóng gói độc lập trong thư mục `src/features/<feature-name>/`:
     - `components/`: Chứa các component/subcomponent giao diện dành riêng cho feature đó (ví dụ: `features/catalog/components/`, `features/review/components/`).
     - `Page.tsx` hoặc các trang view chính: Đặt trực tiếp tại root của feature folder (ví dụ: `features/catalog/CatalogPage.tsx`, `features/review/ReviewWorkspacePage.tsx`).
     - `api/` hoặc `hooks/`: Chứa các hook và lời gọi API chỉ phục vụ riêng tính năng đó.
     - `index.ts`: Export các trang chính hoặc public API của feature để router/app sử dụng.
   - Thư mục `src/features/index.ts` đóng vai trò là single entrypoint re-export toàn bộ các trang và feature module của ứng dụng.

2. **Vai trò tuyệt đối của thư mục `src/components/` trong Apps:**
   - Thư mục `src/components/` trong từng app **CHỈ** được chứa:
     - `common/`: Các component bọc cục bộ (Wrapper, fallback) nếu chưa được chuyển lên `@shared/ui`.
     - `layout/`: Các thành phần bố cục toàn cục của riêng app (Navbar, Footer, Sidebar, UserDropdownMenu, Banner).
   - Tuyệt đối **không** tạo thư mục components nghiệp vụ riêng biệt tại `src/components/<feature>/`. Toàn bộ component nghiệp vụ phải nằm trong `src/features/<feature>/components/`.

---

## 10. QUY TẮC QUẢN LÝ BIẾN MÔI TRƯỜNG & CẤU HÌNH (12-FACTOR APP & ENV)

1. **Tách biệt tuyệt đối Cấu hình (Config) khỏi Mã nguồn (Code):**
   - Tuân thủ nguyên lý Factor III (Config) trong *12-Factor App*.
   - **Nghiêm cấm hoàn toàn anti-pattern fallback ternary hardcode trong code:**
     - ❌ **CẤM:** `const domain = import.meta.env.VITE_OPS_DOMAIN || (import.meta.env.DEV ? 'localhost:5174' : 'ops.signmap.site')`
     - ❌ **CẤM:** Viết cứng URL/domain trong các component hoặc axios client.
   - Toàn bộ giá trị cấu hình theo môi trường bắt buộc phải được khai báo tường minh trong các tệp `.env`:
     - `.env.development`: Cấu hình cho môi trường local dev (`VITE_OPS_DOMAIN=localhost:5174`, `VITE_PUBLIC_DOMAIN=localhost:5173`, `VITE_API_BASE_URL=http://localhost:3000`).
     - `.env.production`: Cấu hình cho production thực tế (`VITE_OPS_DOMAIN=ops.signmap.site`, `VITE_PUBLIC_DOMAIN=signmap.site`, `VITE_API_BASE_URL=https://api.signtrustmap.site`).
     - `.env.example`: Mẫu chuẩn biến môi trường cam kết commit lên git.

2. **Single Source of Truth tại `src/config/env.ts`:**
   - File `src/config/env.ts` ở mỗi app là nơi duy nhất đọc biến từ `import.meta.env`.
   - Mọi nơi trong ứng dụng (Axios Client, Router redirect, Footer, Dropdown...) bắt buộc import từ `@/config/env`, không tự đọc `import.meta.env` trực tiếp.

3. **Cơ chế Xác thực Biến Môi Trường lúc khởi động (Runtime Validation):**
   - Tại `src/config/env.ts`, bắt buộc tích hợp hàm xác thực `validateEnv` ngay khi ứng dụng boot để cảnh báo sớm nếu thiếu biến cấu hình bắt buộc.

---

## 11. QUY TẮC ĐIỀU HƯỚNG LIÊN CỔNG ỨNG DỤNG (CROSS-PORTAL NAVIGATION)

1. **Cơ chế mở Tab mới cho chuyển cổng (External Portal Transitions):**
   - Khi người dùng bấm vào các liên kết chuyển giao giữa hai ứng dụng (ví dụ: từ UserDropdownMenu trên Web sang Ops Workspace, từ link Community Portal trên Ops sang Web):
     - **Bắt buộc mở trong tab mới:** Thẻ `<a>` phải có thuộc tính `target="_blank"` và `rel="noopener noreferrer"`.
     - Tuyệt đối **không** dùng redirect trên tab hiện tại (`window.location.href` trực tiếp) để tránh làm mất trạng thái làm việc dang dở của người dùng.

2. **Đồng bộ đích đến theo Môi trường:**
   - Đường dẫn liên kết luôn trỏ qua biến môi trường chuẩn hóa (`opsPortalUrl` hoặc `communityPortalUrl`).

---

## 12. QUY TẮC PHÂN QUYỀN TRUY CẬP & CƠ CHẾ PHÒNG VỆ ROUTE GUARD (RBAC & ZERO TRUST)

1. **Nguyên tắc Tách biệt Trách nhiệm (Separation of Duties - SoD):**
   - Tuân thủ nghiêm ngặt tài liệu đặc tả dự án:
     - **Staff (Nhân viên vận hành):** Phụ trách hàng đợi duyệt ứng viên biển báo (`/candidates`), điều phối tác vụ (`/tasks`), báo cáo (`/reports`), và phê duyệt/xử lý trả thưởng tín chỉ hàng ngày (`/credits`, `/credits/payments`). Tuyệt đối **không** được can thiệp cấu hình hệ thống, quản lý người dùng, mô hình AI hay chính sách vĩ mô.
     - **Admin (Quản trị viên hệ thống):** Phụ trách quản trị tài khoản người dùng (`/users`), phân quyền vai trò (`/roles`), giám sát MLOps/AIOps (`/mlops`), nhật ký kiểm toán (`/audit-logs`), đè tọa độ không gian GIS (`/spatial-data`), cấu hình chính sách tính điểm/tín chỉ (`/credits/rules`), và **chỉ xử lý các trường hợp ngoại lệ leo thang (`/escalations`)**.
     - Tuyệt đối **không** cho phép Admin thực hiện duyệt các giao dịch tín chỉ hàng ngày (`/credits`) để tránh tập trung quyền lực và gian lận tài chính.

2. **Cơ chế Phòng vệ Tuyến đường: Render Màn hình 403 Tại Chỗ & Giữ Nguyên URL (In-place 403 Render):**
   - Áp dụng đồng bộ cho cả hai hệ thống **Web Portal** (`RoleRoute`) và **Ops Portal** (`AdminGuard`, `StaffGuard`).
   - **Bảo toàn URL trên thanh địa chỉ (URL Preservation):**
     - Khi người dùng truy cập một tuyến đường chưa đủ quyền, hệ thống **bắt buộc giữ nguyên 100% URL gốc** trên thanh địa chỉ và render trực tiếp component 403 tại chỗ.
     - Tuyệt đối **không** dùng redirect đẩy người dùng về `/` hay đổi link thành `/403`. Người dùng có thể copy liên kết gửi cấp trên xin phân quyền, và khi được duyệt chỉ cần nhấn `F5` là vào thẳng trang.
   - **Nguyên tắc Chống Rò rỉ Phân quyền (Zero Information Leak / Anti-Role Enumeration):**
     - Tuyệt đối **không** hiển thị các chuỗi thông báo kỹ thuật dạng debug (như `vai trò reviewer`, `quyền surveyor`) hay in email thô trên giao diện lỗi.
     - Luôn dùng văn phong trung lập, lịch sự và bảo mật theo chuẩn quốc tế (OWASP Top 10): *"Khu vực hạn chế phân quyền. Trang bạn đang cố gắng truy cập bị giới hạn quyền hạn. Vui lòng liên hệ với quản trị viên hệ thống."*
