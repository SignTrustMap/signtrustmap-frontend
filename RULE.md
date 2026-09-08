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
