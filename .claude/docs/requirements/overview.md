# PROJECT OVERVIEW

## 1. Thông tin chung

| Trường | Nội dung |
|---|---|
| **Tên dự án (dự kiến)** | AI Product Document Management Hub (AI-PDMH) |
| **Loại hình sản phẩm** | Web |
| **Mục tiêu chính** | Xây dựng giải pháp quản lý toàn bộ tài liệu sản phẩm từ giai đoạn hình thành Ý tưởng đến khi Đã hiện diện, tích hợp trí tuệ nhân tạo (AI) giúp tự động hóa quá trình soạn thảo, chuyển đổi định dạng chuẩn và tra cứu tri thức tức thì. |

## 2. Bài toán & Mục tiêu Dự án

### 2.1. Vấn đề thực tế

- **Tài liệu bị phân tán và thiếu chuẩn hóa:** Ghi chú ý tưởng nằm rải rác ở nhiều định dạng (`.pdf`, `.docx`, nốt cá nhân), khó tổng hợp thành PRD (Product Requirement Document) chuẩn.
- **Tài liệu sản phẩm live bị trôi/lỗi thời:** Khi sản phẩm lớn lên, việc cập nhật và tra cứu User Manual, API Docs, Release Notes tốn nhiều thời gian và công sức.
- **Khó khăn trong việc tìm kiếm tri thức:** Nhân sự mới hoặc bộ phận CS/Sales tốn nhiều thời gian hỏi đáp để tìm thông tin chính xác trong hệ thống tài liệu dày đặc.

### 2.2. Mục tiêu sản phẩm

- **Tự động hóa chuyển đổi:** Chuẩn hóa mọi tài liệu tải lên (`.pdf`, `.docx`, `.pptx`...) thành định dạng Markdown (`.md`) duy nhất để tối ưu cho cả giao diện đọc của người dùng và việc xử lý dữ liệu của AI.
- **Tối ưu hóa khả năng tra cứu:** Đạt độ chính xác cao trong việc truy vấn dữ liệu nhờ kỹ thuật cắt đoạn theo cấu trúc Markdown (Header Chunking).
- **Phục vụ lưu trữ dữ liệu:** Đạt được mục đích lưu trữ tài liệu lâu dài. File sẽ lưu dưới 2 dạng gồm định dạng gốc và định dạng đã được chuyển đổi thành markdown.

## 3. Phạm vi Chức năng (Functional Scope)

| Phân khu chức năng | Tính năng chi tiết | Mô tả hoạt động |
|---|---|---|
| Quản lý Workspace & Sản phẩm | Workspace & Project Routing | Phân loại tài liệu theo từng Sản phẩm cụ thể (Product A, Product B) và theo trạng thái (Draft/Idea vs. Live). |
| Nhập liệu & Chuyển đổi | Document Converter Pipeline | Tải lên các file `.docx`, `.pdf` → Hệ thống tự động chuyển đổi thành file `.md` giữ nguyên cấu trúc tiêu đề, bảng biểu. |
| Hiển thị & Soạn thảo | Markdown Render & Copilot Editor | Giao diện đọc file `.md` tối ưu UI/UX; Trình soạn thảo Rich Text hỗ trợ gõ `/` để gọi AI. |
| AI Tra cứu & Trích dẫn | RAG Smart Search & Chat | Khung hỏi đáp trực tiếp trên kho tài liệu của sản phẩm. Trả lời chính xác câu hỏi và dẫn nguồn (Cite source) tới đúng mục/tiêu đề trong tài liệu `.md`. |
| Hỗ trợ Giai đoạn Live | Auto-Release Notes & Update Alert | AI hỗ trợ tóm tắt tính năng mới thành Release Notes và cảnh báo các phần tài liệu cũ có nguy cơ bị sai lệch thông tin. |

## 4. Giao diện dự kiến

*(Đang cập nhật)*

## 5. Kiến trúc Hệ thống

```
[ User Interface (Next.js) ]
            │
            ▼
[ Backend API (FastAPI / Python) ]
            │
            ├────► [ Conversion Service (Docling / Mammoth) ] ──► Lưu File .md
            │
            └────► [ RAG Engine (LangChain) ]
                        │
                        ├────► Splitter: MarkdownHeaderTextSplitter
                        ├────► Vector DB: Supabase pgvector / Qdrant
                        └────► LLM API: OpenAI GPT-4o-mini / Gemini 1.5 Flash
```

### Chi tiết Stack công nghệ

| Layer | Công nghệ |
|---|---|
| **Frontend Framework** | Next.js (React) + Tailwind CSS + Shadcn/ui |
| **Markdown Rendering & Editing** | `react-markdown` + `@tailwindcss/typography` (render); Tiptap (AI Inline Copilot) |
| **Backend & Conversion Engine** | FastAPI (Python) + Docling (chuyển đổi đa định dạng sang `.md`) |
| **AI Framework & Vector Database** | LangChain / LlamaIndex + MarkdownHeaderTextSplitter + Supabase pgvector (hoặc Qdrant) |
| **LLMs & Embeddings** | Google Gemini 1.5 Flash / OpenAI `text-embedding-3-small` |

## 6. Kế hoạch Triển khai Dự kiến

### Giai đoạn 1: Triển khai MVP Core (Tuần 1 - Tuần 2)

- Dựng khung giao diện Frontend (Workspace, Project list, Layout đọc tài liệu).
- Xây dựng API Backend tiếp nhận file (`.docx`, `.pdf`) và pipeline chuyển đổi sang `.md` dùng Docling.
- Tích hợp component render `.md` hiển thị chuẩn cấu trúc trên Frontend.

### Giai đoạn 2: Tích hợp AI Engine & RAG (Tuần 3)

- Xây dựng module cắt file `.md` theo Header Splitter và đẩy dữ liệu Vector vào Database.
- Dựng màn hình Chatbot AI tra cứu thông tin trên tài liệu đã upload.

### Giai đoạn 3: AI Copilot & Hoàn thiện (Tuần 4)

- Tích hợp tính năng AI Copilot trong bộ gõ (viết tiếp PRD, tóm tắt ý tưởng).
- Kiểm thử toàn bộ luồng (End-to-End Test), tối ưu prompt và chuẩn bị demo gửi review.
