# Function List

## Authentication

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 1 | Đăng ký tài khoản | Người dùng tạo tài khoản bằng Username, Display Name, Email và Password; tài khoản mới ở trạng thái chờ xác nhận. |
| 2 | Xác nhận Email / OTP | Nhập OTP được gửi qua Email để kích hoạt tài khoản. |
| 3 | Gửi lại OTP | Gửi lại mã OTP xác nhận khi mã cũ hết hạn hoặc không còn dùng được. |
| 4 | Xác thực từ admin | Cần admin xác nhận mới có thể đăng nhập được. |
| 5 | Đăng nhập | Xác thực tài khoản và cấp token để truy cập các chức năng yêu cầu đăng nhập. |
| 6 | Đăng xuất | Kết thúc phiên đăng nhập hiện tại và xóa thông tin xác thực ở phía client. |
| 7 | Quên mật khẩu | Gửi yêu cầu khôi phục mật khẩu qua Email. |
| 8 | Xác nhận OTP reset | Xác thực OTP dùng cho quá trình đặt lại mật khẩu. |
| 9 | Đặt lại mật khẩu | Thiết lập mật khẩu mới sau khi OTP reset hợp lệ. |

## User Profile

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 10 | Xem hồ sơ cá nhân | Hiển thị thông tin profile và các hoạt động gần nhất của người dùng. |
| 11 | Chỉnh sửa hồ sơ cá nhân | Cập nhật Avatar, Bio, Display Name. |
| 12 | Quản lý Avatar | Upload, crop và xóa ảnh đại diện của chính người dùng. |
| 13 | Xem Document của người dùng | Hiển thị các document hoặc folder thuộc người dùng; người khác chỉ thấy Document được phân quyền xem chung. |

## Document Management

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 14 | Upload Document/Markdown | Người dùng đăng nhập upload Document mới. Hệ thống sẽ tạo một bản sao markdown. Người upload sẽ quyết định document và folder đi kèm sẽ được ai xem. |
| 15 | View/Edit Document | Những người được phân, cấp quyền sẽ được xem và sửa. |
| 16 | View/Edit Markdown | Được xem, chỉnh sửa markdown. |
| 17 | Download Raw/Markdown | Cho phép download document raw hoặc là bản markdown. |
| 18 | Version history | Được xem lịch sử chỉnh sửa của document. |
| 19 | Update Document | Chủ sở hữu chuyển Project giữa Public và Draft; Draft không hiển thị cho người khác. |
| 20 | Delete document | Mỗi Project có một Genre bắt buộc theo thiết kế cơ sở dữ liệu. |
| 21 | Notes/Comment | Người khác có thể note hoặc comment ở cuối dòng (dành cho raw) và thêm note vị trí cụ thể (dành cho bản markdown). |

## Folder Management

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 22 | Create Folder | Tạo folder mới. Mặc định phân quyền ở Folder. Document tự động kế thừa quyền của Folder. |
| 23 | Move Folder | Chuyển thư mục sang vị trí mới; quyền truy cập tự động cập nhật theo thư mục cha mới. |
| 24 | Delete Folder | Xóa thư mục; cảnh báo người dùng nếu thư mục có chứa tài liệu/thư mục con. |
| 25 | Rename Folder | Đổi tên thư mục; không được trùng tên với các thư mục cùng cấp. |

## Permission Management

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 26 | User Permission | Phân quyền chi tiết (Xem, Sửa, Sở hữu) theo người dùng hoặc nhóm cho từng Thư mục/Tài liệu. |
| 27 | Role Management | Quản lý các nhóm quyền/vai trò hệ thống (Admin, Manager, User, Editor) và cấp phép tương ứng. |
| 28 | Folder Permission | Thiết lập quyền riêng cho Folder (Xem, Sửa, Quản trị) áp dụng cho từng User/Role. |
| 29 | Document Permission | Gán quyền riêng biệt trên từng tài liệu (ghi đè hoặc bổ sung so với quyền Folder cha). |

## AI Agent

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 30 | Ask AI | Gửi câu hỏi hoặc yêu cầu xử lý tài liệu tới AI Agent qua giao diện hội thoại. |
| 31 | AI Answer | Hiển thị câu trả lời tự động từ AI kèm trích dẫn nguồn tài liệu tham chiếu (nếu có). |
| 32 | Conversation History | Lưu trữ và xem lại danh sách các phiên trò chuyện/hỏi đáp cũ với AI. |

## Administration (For admin)

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 33 | User Management | Quản lý danh sách tài khoản (Tạo mới, Khóa/Kích hoạt, Đổi mật khẩu, Gán vai trò). |
| 34 | System Configuration | Cấu hình các tham số hệ thống (Dung lượng upload tối đa, định dạng file, kết nối SMTP, v.v.). |
| 35 | AI Configuration | Cấu hình thông số API Key, model AI (GPT-4, Claude, Gemini), prompt mặc định và hạn mức (Quota). |
| 36 | Activity Log | Ghi vết hoạt động người dùng (Đăng nhập, Tạo/Sửa/Xóa tài liệu, Thay đổi phân quyền). |
| 37 | AI Query Log | Thống kê và theo dõi lịch sử truy vấn AI, chi phí token và hiệu suất phản hồi của hệ thống. |

## Notifications & Dashboard (For admin)

| # | Feature (Tính năng) | Note (Ghi chú) |
|---|---|---|
| 38 | Xem Notifications | Hiển thị danh sách thông báo hệ thống (nhắc nhở, cập nhật tài liệu, thay đổi quyền, cảnh báo) cho người dùng. |
| 39 | Đánh dấu Notification đã đọc | Cập nhật trạng thái thông báo từ "chưa đọc" sang "đã đọc" (đơn lẻ hoặc tất cả). |
| 40 | Xem Dashboard | Hiển thị tổng quan các chỉ số hệ thống (số lượng tài liệu, dung lượng sử dụng, hoạt động gần đây, thống kê truy vấn AI). |
| 41 | Search | Tìm kiếm nhanh tài liệu, thư mục hoặc nội dung theo từ khóa, thẻ (tags) và bộ lọc nâng cao. |
