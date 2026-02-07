# 🦉 THIÊN TOOL 

Chào mừng bạn đến với công cụ quản lý và tối ưu hóa trải nghiệm học tập trên Duolingo. Script này tích hợp đầy đủ các tính năng từ tự động hóa (Automation) đến can thiệp hệ thống để mở khóa các gói cao cấp.

---

## 🌟 TÍNH NĂNG CHÍNH

### 1. ⚡ HackDuo Control (DuoVip)
- **Mở khóa Super/Max:** Can thiệp Network (Fetch/XHR) để trải nghiệm giao diện và tính năng của gói Super hoặc MAX hoàn toàn miễn phí.
- **Farm XP:** Tự động hoàn thành bài học để cày điểm kinh nghiệm nhanh chóng (tùy chỉnh tốc độ ms).
- **Farm Gems:** Nhận đá quý tự động thông qua API phần thưởng.
- **Sửa Streak:** Khôi phục hoặc tăng số ngày streak tùy ý.
- **Nhiệm vụ & Huy hiệu:** + 📅 Tự động làm nhiệm vụ ngày (chạy 10 bài XP).
    + 🏆 Nhận toàn bộ huy hiệu tháng (Monthly Badges) từ quá khứ đến hiện tại.
- **Vật phẩm Shop:** Nhận ngay x2 XP, Streak Freeze và Hearts không tốn tiền.

### 2. 🔑 Quản lý tài khoản (Account Manager)
- **Lưu trữ đa tài khoản:** Tự động lưu Token (JWT) và tên người dùng ngay khi đăng nhập.
- **Chuyển đổi nhanh:** Login ngay lập tức giữa các tài khoản đã lưu mà không cần mật khẩu.
- **Backup/Restore:** Xuất/Nhập danh sách tài khoản dưới dạng file JSON để tránh mất dữ liệu.

### 3. 🛠️ Super Maker (Quản lý Link Gia Đình)
- **Auto Get Link:** Khi ở trang `/settings/super`, script tự động click nhận link và lưu lại.
- **Quản lý danh sách:** Hỗ trợ Copy, Dán và Reset danh sách link mời chuyên nghiệp.

### 4. 📂 Txt-Editor (Công cụ bổ trợ)
- **Xóa dòng:** Xóa nhanh n dòng đầu tiên của file .txt.
- **Cắt file:** Tự động cắt file .txt lớn thành nhiều file nhỏ theo số dòng định sẵn (VD: 150 dòng/file) và tải về hàng loạt.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT

1. Cài đặt tiện ích [Tampermonkey](https://www.tampermonkey.net/).
2. Tạo script mới, dán toàn bộ mã nguồn `Thiên` vào và lưu lại.
3. Truy cập Duolingo.com, nhấp vào nút **Paimon** tròn bên trái màn hình để mở Menu chính.

---

## ⚙️ THÔNG TIN KỸ THUẬT
- **Phiên bản:** 6.3.10 (Silent Auto Get)
- **Giao diện:** Hỗ trợ Dark Mode/Light Mode.
- **Quyền hạn:** Sử dụng `GM_xmlhttpRequest` để gọi API và `GM_setValue` để lưu token an toàn.

## ⚠️ LƯU Ý
- Script được tạo ra cho mục đích học tập và nghiên cứu. 
- Nên điều chỉnh "Tốc độ (ms)" phù hợp (trên 100ms) để tránh bị hệ thống quét.

---
**Author:** Thiên (Lớp 12A3)
**Github/Support:** Tampermonkey.net
