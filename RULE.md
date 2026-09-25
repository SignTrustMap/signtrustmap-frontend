# QUY TẮC PHÁT TRIỂN DỰ ÁN (PROJECT RULES & CONVENTIONS)
> **SignTrustMap Frontend** — Tài liệu tổng hợp các quy chuẩn về Kiến trúc API, Giao diện (UI/UX), và Đa ngôn ngữ (i18n) để duy trì tính nhất quán cho toàn bộ dự án.

---

## 1. QUY TẮC DỮ LIỆU & GỌI API (API & DATA ARCHITECTURE)

1. **Tách biệt dữ liệu mẫu (Mock Data Isolation):**
   - Tuyệt đối **không** viết mock data inline trực tiếp bên trong các file component hay file trang (`pages/`, `components/`).
   - Mọi dữ liệu mẫu phải được tổ chức thành các file riêng trong thư mục `src/data/` (ví dụ: `mockReview.ts`, `mockCatalog.ts`, `mockSurvey.ts`, `mockProfile.ts`, `mockMapSigns.ts`).
   - Mỗi file mock data phải export rõ ràng:
     - Các **TypeScript Interfaces/Types** định nghĩa cấu trúc dữ liệu.
     - Dữ liệu mảng/đối tượng mẫu chuẩn hóa.
   - Thư mục `src/data/index.ts` đóng vai trò là single entrypoint để re-export tất cả types và mock data.

2. **Chuẩn hóa tích hợp API:**
   - Dữ liệu mock phải mô phỏng chính xác payload và response từ REST API/tài liệu đặc tả (`a.md`, `b.md`).
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

## 2. QUY TẮC GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX DESIGN)

1. **Thẩm mỹ & Màu sắc (Color Palette & Dark/Light Theme):**
   - Dự án hỗ trợ cả **Dark Mode** (mặc định cho tech/web workspace) và **Light Mode**:
     - **Dark Mode**: Nền sâu `#030708`, card/panel `#061417` hoặc `#071317`, viền `border-white/10`, màu nhấn neon cyan `#00c4de`, emerald `#10b981`, amber `#f59e0b`.
     - **Light Mode**: Nền dịu `#F8F7F7`, card/panel `bg-white`, viền `#E8E4E3` hoặc `border-gray-200`, màu nhấn teal đậm `#007b8b`, chữ đen xám tương phản cao `#111827`.
   - Độ tương phản chữ: Chữ luôn rõ ràng, dễ đọc, không dùng màu xám quá nhạt trên nền trắng hoặc xám quá tối trên nền đen (học hỏi phong cách trực quan của trang **Profile**).

2. **Quy tắc hiển thị Bản đồ (Map & Leaflet Layers):**
   - **Xử lý z-index tuyệt đối:** Bản đồ Leaflet luôn phải được đặt trong vùng chứa có class `relative isolate z-0` hoặc z-index thấp, tuyệt đối không được che đè lên Navbar (`z-40`/`z-50`), Dropdown menu hoặc Modal popup.
   - Giữ lại đầy đủ attribution OpenStreetMap theo quy định.

3. **Quy chuẩn thiết kế Modal (Modal Consistency):**
   - Mọi popup/modal nghiệp vụ (như `SurveyDetailModal`, `NewSignTypeModal`, `FlagCandidateModal`, `CatalogModal`) phải tuân theo cấu trúc chuẩn:
     - **Header:** Chứa hệ thống tag/badge trạng thái, tiêu đề lớn in đậm, subtitle có icon thương hiệu (`Sparkle`, `TrafficSignal`...), và nút đóng `X`.
     - **Body:** Các section thông tin được đóng gói trong card bo tròn `rounded-2xl` với nền mờ nhẹ.
     - **Footer:** Nút phụ (Hủy / Đóng) đặt bên trái, nút hành động chính (Gửi / Xác nhận / Phê duyệt) đặt bên phải với màu sắc và shadow nổi bật.
     - Hỗ trợ đóng modal khi bấm phím `Esc` hoặc bấm ra ngoài overlay.

4. **Chuẩn hóa Phân trang (Pagination Standard):**
   - Tất cả các danh sách có nhiều trang (Lịch sử khảo sát, Lịch sử duyệt, Bảng giao dịch, Danh sách biển báo...) phải dùng chung component `Pagination.tsx`.
   - Đồng bộ số lượng item trên mỗi trang và hiển thị rõ ràng `Trang X / Y` kèm các nút chuyển trang đầu/cuối/trước/sau.

5. **Tối ưu hóa Thao tác Bàn phím (Keyboard Accessibility & Hotkeys):**
   - Các màn hình mang tính chất thẩm định dữ liệu khối lượng lớn (như **Reviewer Workspace**) bắt buộc hỗ trợ phím tắt (`A`: Duyệt, `R`: Từ chối, `C`: Sửa nhãn, `F`: Cắm cờ, `Mũi tên`: Chuyển ca...).
   - Hiển thị gợi ý phím tắt trực quan dạng thẻ `<kbd>` ngay trên các nút bấm.
   - Khi focus vào ô nhập text (`input`, `textarea`), phím tắt duyệt phải tạm thời bị vô hiệu hóa để tránh bấm nhầm.

6. **Chuẩn hóa Tiêu đề & Bố cục Đầu trang (PageHeader Standard):**
   - 100% các trang nghiệp vụ (cả Staff lẫn Admin) bắt buộc dùng chung component `PageHeader.tsx` (`src/components/common/PageHeader.tsx`).
   - Tuyệt đối không tự viết thẻ `<h1>` riêng rẽ với kích cỡ font lệch nhau. Tiêu chuẩn kiểu chữ thống nhất cho toàn bộ hệ thống là: `text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight`.
   - Giữ tiêu đề tối giản và tinh gọn, không chèn các tag râu ria hoặc đoạn mô tả thừa thãi phía trên/dưới. Các nút thao tác cấp trang (Lưu, Xuất tệp, Tạo mới...) phải được truyền qua prop `actions` để hiển thị thẳng hàng ở góc phải.

7. **Chuẩn hóa Bộ lọc & Bộ chọn Thống nhất (DataFilterBar & CustomSelect Standard):**
   - Mọi thanh tìm kiếm & lọc dữ liệu trên danh sách/bảng nghiệp vụ (khảo sát, tái thẩm định, duyệt biển, danh mục QCVN...) bắt buộc dùng chung component `DataFilterBar.tsx` (`src/components/common/DataFilterBar.tsx`).
   - Tuyệt đối **không** dùng thẻ `<select>` gốc của trình duyệt (vốn bị lỗi xám xịt và vỡ phong cách trên Dark Mode), bắt buộc sử dụng component `CustomSelect` có theme styling đồng nhất, hỗ trợ đóng/mở mượt mà và trạng thái focus/active chuẩn mực.
   - Hỗ trợ truyền các dropdown/bộ lọc mở rộng linh hoạt thông qua prop `children`.

8. **Chuẩn hóa Màn hình Lỗi Toàn cục (Global Error Canvas: 403 & 404):**
   - Tuyệt đối **không** nhốt nội dung lỗi vào trong các ô hộp (card box) nhỏ cô đơn giữa màn hình trắng.
   - Áp dụng bố cục **Open Hero Canvas** tràn màn hình tự nhiên giữa Navbar và Footer (`min-h-[calc(100vh-140px)]`):
     - Nền địa hình 3D Wireframe (`/images/hero-wireframe.jpg`) với spotlight, radial glow và fade gradient mượt mà.
     - Chữ số lỗi **`403`** / **`404`** kích thước lớn (`text-8xl sm:text-9xl md:text-[11rem] font-extrabold`), phủ dải màu chuyển sắc gradient đồng nhất với chữ **"Trust"** của trang chủ (`bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan` ở Dark Mode và `from-[#007b8b] to-[#00c4de]` ở Light Mode).
     - Nút điều hướng bo tròn dạng viên thuốc (`rounded-full px-8 py-3.5`) chuẩn màu nút Hero trang chính (`text-black bg-[#00c4de]` ở Dark, `text-white bg-[#007b8b]` ở Light).
     - Thông tin tối giản, tập trung vào giải pháp cho người dùng.

---

## 3. QUY TẮC ĐA NGÔN NGỮ & BẢN DỊCH (I18N CONVENTIONS)

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
   - **Cho phép giữ nguyên các thuật ngữ tiếng Anh phổ biến:** Nếu trong tiếng Việt từ đó ít được sử dụng, xa lạ hoặc từ tiếng Anh đã quá quen thuộc với người dùng công nghệ, hãy giữ nguyên từ tiếng Anh.
     - *Ví dụ các từ giữ nguyên:* `Crop`, `Context`, `Credits`, `Track ID`, `GPS`, `YOLO`, `Leaderboard`, `Hotkeys`, `Live View`, `OSM`, `Voyager`.
     - *Ví dụ các từ dịch chuẩn:* `Phê duyệt`, `Từ chối`, `Cắm cờ / Báo cáo`, `Tái thẩm định`, `Độ tin cậy`, `Biển báo giao thông`, `Đồng thuận`.

4. **Quy tắc đặt tên key (Key Naming Convention):**
   - Đặt tên theo dạng `snake_case` có tiền tố phân nhóm chức năng:
     - Nút bấm: `btn_approve`, `btn_reject`, `btn_cancel`
     - Nhãn form: `lbl_name`, `lbl_category`, `lbl_coords`
     - Placeholder: `ph_search`, `ph_notes`
     - Thông báo Toast: `toast_success`, `toast_error`
     - Thông báo lỗi: `err_required`, `err_invalid_format`

---

## 4. QUY TẮC CẤU TRÚC THƯ MỤC THEO TÍNH NĂNG (FEATURE-DRIVEN ARCHITECTURE)

1. **Mô hình tổ chức Feature-Based thống nhất (Đồng bộ Web & Ops):**
   - Thay vì phân mảnh theo kiểu cũ (tách rời `pages/` một nơi và `components/` một nơi), dự án áp dụng mô hình Feature-Driven chuẩn công nghiệp quốc tế cho cả `apps/web` và `apps/ops`:
   - Mọi tính năng nghiệp vụ được đóng gói độc lập trong thư mục `src/features/<feature-name>/`:
     - `components/`: Chứa các component giao diện dành riêng cho feature đó (ví dụ: `features/review/components/`, `features/survey/components/`).
     - `Page.tsx` hoặc các trang view chính: Đặt trực tiếp tại root của feature folder (ví dụ: `features/review/ReviewWorkspacePage.tsx`, `features/profile/ProfilePage.tsx`).
     - `api/` hoặc `hooks/`: Chứa các hook và lời gọi API chỉ phục vụ riêng tính năng đó.
     - `index.ts`: Export các trang chính hoặc public API của feature để router/app sử dụng.
   - Thư mục `src/features/index.ts` đóng vai trò là single entrypoint re-export toàn bộ các trang và feature module của ứng dụng.

2. **Vai trò tuyệt đối của thư mục `src/components/`:**
   - Thư mục `src/components/` **CHỈ** được chứa 2 nhóm:
     - `common/`: Các UI Primitives thuần túy dùng chung trên toàn ứng dụng (Buttons, Modals, Pagination, Badges, Tooltips, Empty States, Skeletons).
     - `layout/`: Các thành phần bố cục toàn cục (Navbar, Footer, Sidebar, UserDropdownMenu, Banner).
   - Tuyệt đối **không** tạo thư mục components nghiệp vụ riêng biệt tại `src/components/<feature>/` (như `components/review/`, `components/auth/`). Toàn bộ component nghiệp vụ phải nằm trong `src/features/<feature>/components/`.

---

## 5. QUY TẮC QUẢN LÝ BIẾN MÔI TRƯỜNG & CẤU HÌNH (12-FACTOR APP & ENV CONVENTIONS)

1. **Tách biệt tuyệt đối Cấu hình (Config) khỏi Mã nguồn (Code):**
   - Tuân thủ nguyên lý Factor III (Config) trong *12-Factor App*.
   - **Nghiêm cấm hoàn toàn anti-pattern fallback ternary hardcode trong code:**
     - ❌ **CẤM:** `const domain = import.meta.env.VITE_OPS_DOMAIN || (import.meta.env.DEV ? 'localhost:5174' : 'ops.signmap.site')`
     - ❌ **CẤM:** Viết cứng URL/domain trong các component hoặc axios client.
   - Toàn bộ giá trị cấu hình theo môi trường bắt buộc phải được khai báo tường minh trong các tệp `.env`:
     - `.env.development`: Cấu hình cho môi trường local dev (ví dụ: `VITE_OPS_DOMAIN=localhost:5174`, `VITE_PUBLIC_DOMAIN=localhost:5173`, `VITE_API_BASE_URL=http://localhost:3000`).
     - `.env.production`: Cấu hình cho production thực tế (`VITE_OPS_DOMAIN=ops.signmap.site`, `VITE_PUBLIC_DOMAIN=signmap.site`, `VITE_API_BASE_URL=https://api.signtrustmap.site`).
     - `.env.example`: Mẫu chuẩn biến môi trường cam kết commit lên git để onboarding thành viên mới.

2. **Single Source of Truth tại `src/config/env.ts`:**
   - File `src/config/env.ts` ở mỗi app là nơi duy nhất đọc biến từ `import.meta.env`.
   - File này chỉ làm nhiệm vụ:
     - Đọc giá trị từ `import.meta.env`.
     - Chuẩn hóa URL qua helper format (tự động gắn `http://` trong dev và `https://` trong prod nếu domain chưa có giao thức).
     - Export object `env` đóng băng (`as const`) cùng các URL dẫn xuất (`opsPortalUrl`, `communityPortalUrl`, `opsLoginUrl`).
   - Mọi nơi trong ứng dụng (Axios Client, Router redirect, Footer, Dropdown...) bắt buộc import từ `@/config/env`, không tự đọc `import.meta.env` trực tiếp.

3. **Cơ chế Xác thực Biến Môi Trường lúc khởi động (Runtime Validation):**
   - Tại `src/config/env.ts`, bắt buộc tích hợp hàm xác thực `validateEnv` ngay khi ứng dụng boot.
   - Nếu phát hiện thiếu bất kỳ biến bắt buộc nào (như `VITE_API_BASE_URL`, `VITE_OPS_DOMAIN`, `VITE_PUBLIC_DOMAIN`...):
     - Ghi log cảnh báo định dạng màu nổi bật (`console.warn`) trong DevTools Console để lập trình viên phát hiện và khắc phục ngay lập tức, tránh lỗi âm thầm (silent failure) do biến rỗng gây ra.

---

## 6. QUY TẮC ĐIỀU HƯỚNG LIÊN CỔNG ỨNG DỤNG (CROSS-PORTAL NAVIGATION)

1. **Cơ chế mở Tab mới cho chuyển cổng (External Portal Transitions):**
   - Hệ thống gồm 2 ứng dụng độc lập: **Web Portal** (dành cho người dùng công cộng, khảo sát, tài xế) và **Ops Portal** (dành cho Staff, Reviewer, Admin vận hành).
   - Khi người dùng bấm vào các liên kết chuyển giao giữa hai ứng dụng (ví dụ: từ UserDropdownMenu trên Web sang Ops Workspace, từ link Community Portal trên Ops sang Web, hoặc link Reviewer trong Footer):
     - **Bắt buộc mở trong tab mới:** Thẻ `<a>` phải có thuộc tính `target="_blank"` và `rel="noopener noreferrer"`.
     - Tuyệt đối **không** dùng redirect trên tab hiện tại (`window.location.href` trực tiếp) để tránh làm mất trạng thái làm việc dang dở (unsaved review, active map view, form data) của người dùng ở cổng hiện tại.

2. **Đồng bộ đích đến theo Môi trường:**
   - Đường dẫn liên kết luôn trỏ qua biến môi trường chuẩn hóa (`opsPortalUrl` hoặc `communityPortalUrl`), đảm bảo ở môi trường dev trỏ đúng local port của app đối ứng (`localhost:5174` hoặc `localhost:5173`) và ở production trỏ đúng subdomain chính thức (`ops.signmap.site` và `signmap.site`).

---

## 7. QUY TẮC PHÂN QUYỀN TRUY CẬP & CƠ CHẾ PHÒNG VỆ ROUTE GUARD (RBAC & ZERO TRUST ROUTING)

1. **Nguyên tắc Tách biệt Trách nhiệm (Separation of Duties - SoD):**
   - Tuân thủ nghiêm ngặt tài liệu đặc tả dự án (`a.md`, `b.md`, `FA26SE003_SignTrustMap_DucDNM2.docx`, `Report1_Project Introduction.docx`):
     - **Staff (Nhân viên vận hành):** Phụ trách hàng đợi duyệt ứng viên biển báo (`/candidates`), điều phối tác vụ (`/tasks`), báo cáo (`/reports`), và phê duyệt/xử lý trả thưởng tín chỉ hàng ngày (`/credits`, `/credits/payments`). Tuyệt đối **không** được can thiệp cấu hình hệ thống, quản lý người dùng, mô hình AI hay chính sách vĩ mô.
     - **Admin (Quản trị viên hệ thống):** Phụ trách quản trị tài khoản người dùng (`/users`), phân quyền vai trò (`/roles`), giám sát MLOps/AIOps (`/mlops`), nhật ký kiểm toán (`/audit-logs`), đè tọa độ không gian GIS (`/spatial-data`), cấu hình chính sách tính điểm/tín chỉ (`/credits/rules`), và **chỉ xử lý các trường hợp ngoại lệ leo thang (`/escalations`)**.
     - Tuyệt đối **không** cho phép Admin thực hiện duyệt các giao dịch tín chỉ hàng ngày (`/credits`). Đây là nguyên tắc bắt buộc trong kiểm soát gian lận tài chính và tránh tập trung quyền lực (Separation of Duties).

2. **Cơ chế Phòng vệ Tuyến đường: Render Màn hình 403 Tại Chỗ & Giữ Nguyên URL (In-place 403 Render & Zero Information Leak):**
   - Áp dụng đồng bộ cho cả hai hệ thống **Web Portal** (`RoleRoute`) và **Ops Portal** (`AdminGuard`, `StaffGuard`).
   - **Bảo toàn URL trên thanh địa chỉ (URL Preservation):**
     - Khi người dùng truy cập một tuyến đường yêu cầu đặc quyền cao hơn mà chưa đủ quyền (ví dụ: Staff vào `/users`, Admin vào `/candidates`, Driver vào `/survey`), hệ thống **bắt buộc giữ nguyên 100% URL gốc** trên thanh địa chỉ trình duyệt và render trực tiếp component 403 (`Forbidden403Page` trên Web / `NotAllowedPage` trên Ops) tại chỗ.
     - Tuyệt đối **không** dùng redirect đẩy người dùng về `/` hay đổi link thành `/403`, tránh gây giật trang bất ngờ và làm mất liên kết gốc.
     - **Mục đích UX & Vận hành:** Người dùng có thể sao chép chính xác liên kết gửi cho Quản trị viên/Sếp xin cấp quyền. Sau khi được phân quyền xong, chỉ cần nhấn `F5` tải lại trang là lập tức truy cập thẳng vào trang làm việc.
   - **Chuẩn hóa Nút Hành động Điều hướng Tinh gọn:**
     - Trên màn hình 403, chỉ giữ đúng 2 nút điều hướng tinh gọn, rõ ràng theo quy chuẩn Hero CTA:
       - Nút chính **[Quay Lại]**: Cho phép người dùng lùi lại trang an toàn trước đó (`navigate(-1)`).
       - Nút phụ **[Về Bảng Điều Khiển]** (trên Ops) / **[Về Trang Chủ]** (trên Web): Đưa người dùng về vùng làm việc mặc định.
     - Giữ giao diện khoáng đạt, không rườm rà nút phụ phân nhánh làm phân tâm người dùng.
   - **Nguyên tắc Chống Rò rỉ Phân quyền (Zero Information Leak / Anti-Role Enumeration):**
     - Tuyệt đối **không** hiển thị các chuỗi thông báo kỹ thuật dạng debug (như `vai trò reviewer`, `quyền surveyor`) hay in email thô trong dấu ngoặc đơn trên giao diện lỗi.
     - Luôn dùng văn phong trung lập, lịch sự và bảo mật theo chuẩn quốc tế (OWASP Top 10): *"Khu vực hạn chế phân quyền. Trang bạn đang cố gắng truy cập bị giới hạn quyền hạn. Vui lòng liên hệ với quản trị viên hệ thống."* Tránh để lộ sơ đồ phân quyền nội bộ (RBAC Mapping) cho người dùng bên ngoài hoặc kẻ tấn công.

