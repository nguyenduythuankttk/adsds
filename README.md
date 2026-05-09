# ☕ Jolibi — Hệ thống quản lý nhà hàng

Jolibi là ứng dụng quản lý nhà hàng/quán cà phê full-stack, cung cấp giao diện riêng biệt cho **khách hàng** và **nhân viên**. Hệ thống xử lý toàn bộ quy trình từ đặt bàn, gọi món, thanh toán đến quản lý kho và nhà cung cấp.

---

## Mục lục

- [Tính năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Documentation](#api-documentation)
- [Thành viên nhóm](#thành-viên-nhóm)

---

## Tính năng

**Xác thực & Phân quyền**
- Đăng ký, đăng nhập riêng cho khách hàng và nhân viên
- JWT Bearer token với thời hạn 8 giờ
- Mã hóa mật khẩu bằng BCrypt

**Quản lý thực đơn**
- Danh mục sản phẩm, sản phẩm, biến thể (size/topping)
- Combo khuyến mãi

**Vận hành nhà hàng**
- Quản lý bàn ăn và đặt bàn (booking)
- Tạo hóa đơn, xử lý thanh toán
- Theo dõi đơn giao hàng

**Kho & Cung ứng**
- Quản lý nguyên liệu và kho hàng
- Nhà cung cấp, đơn đặt hàng, phiếu nhập kho

**Nhân sự**
- Quản lý nhân viên và ca làm việc

**Hệ thống**
- Gửi email thông báo qua Resend API
- Tự động xóa dữ liệu đã xóa mềm sau 30 ngày

---

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Backend | ASP.NET Core (.NET 10), C# |
| ORM | Entity Framework Core 9 |
| Database chính | MySQL 8 |
| Database phụ | MongoDB Atlas |
| Xác thực | JWT Bearer + BCrypt.Net |
| Email | Resend API |
| API Docs | Scalar UI |
| Frontend | HTML5, CSS3, Vanilla JavaScript |

---

## Yêu cầu hệ thống

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- MySQL 8.0+
- Git
- Tài khoản [Resend](https://resend.com) (để gửi email)
- *(Tùy chọn)* Node.js 18+ (cho MongoDB driver phụ)

---

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd PBL3
```

### 2. Tạo database MySQL

```sql
CREATE DATABASE DBjolibi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Cấu hình `appsettings.json`

Sao chép file mẫu và điền thông tin thực tế:

```bash
cp BackEnd/appsettings.example.json BackEnd/appsettings.json
```

Xem chi tiết tại mục [Cấu hình](#cấu-hình).

### 4. Chạy migrations

```bash
cd BackEnd
dotnet ef database update
```

---

## Cấu hình

Chỉnh sửa file `BackEnd/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "JolibiDatabase": "Server=localhost;Port=3306;Database=DBjolibi;User=root;Password=<mật_khẩu_mysql>",
    "JolibiMongo": "mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?appName=Cluster0"
  },
  "Resend": {
    "ApiKey": "<resend_api_key>"
  },
  "FrontendUrl": "http://localhost:5000",
  "HardDelete": {
    "IntervalHours": 24,
    "RetentionDays": 30
  },
  "Jwt": {
    "Key": "<secret_key_tối_thiểu_32_ký_tự>",
    "Issuer": "PBL3API",
    "Audience": "PBL3Client",
    "ExpiryMinutes": 480
  }
}
```

| Biến | Mô tả |
|------|-------|
| `JolibiDatabase` | Connection string MySQL |
| `JolibiMongo` | URI kết nối MongoDB Atlas |
| `Resend.ApiKey` | API key từ dashboard Resend |
| `FrontendUrl` | URL frontend (dùng cho CORS) |
| `HardDelete.RetentionDays` | Số ngày giữ dữ liệu đã xóa mềm trước khi xóa vĩnh viễn |
| `Jwt.Key` | Khóa ký JWT, **phải thay đổi** trước khi deploy |
| `Jwt.ExpiryMinutes` | Thời hạn token (phút) |

---

## Chạy ứng dụng

### Backend

```bash
cd BackEnd
dotnet run
```

API sẽ chạy tại: `http://localhost:5188`

### Frontend

Mở `FrontEnd/index.html` bằng Live Server (VS Code) hoặc bất kỳ HTTP server tĩnh nào trên cổng `5000`:

```bash
# Ví dụ với Python
python -m http.server 5000 --directory FrontEnd
```

Truy cập: `http://localhost:5000`

---

## Cấu trúc thư mục

```
PBL3/
├── BackEnd/                        # ASP.NET Core API
│   ├── Controller/                 # 16 REST controllers
│   │   ├── authController.cs
│   │   ├── billController.cs
│   │   ├── productController.cs
│   │   └── ...
│   ├── Models/                     # Domain models & DTOs
│   ├── Services/
│   │   ├── Interfaces/             # Định nghĩa service contracts
│   │   └── Implementations/        # Logic nghiệp vụ
│   ├── Data/                       # Entity Framework DbContext
│   ├── Migrations/                 # EF Core migrations
│   ├── Program.cs                  # Cấu hình ứng dụng & DI
│   └── appsettings.json            # Cấu hình (không commit lên git)
│
└── FrontEnd/                       # Giao diện người dùng
    ├── index.html                  # Trang đăng nhập (Customer / Employee)
    ├── js/
    │   ├── api.js                  # HTTP client tích hợp JWT
    │   └── auth.js                 # Quản lý phiên đăng nhập
    ├── customer/                   # Giao diện khách hàng
    └── employee/                   # Giao diện nhân viên
```

---

## API Documentation

Sau khi chạy backend, truy cập tài liệu API tương tác tại:

```
http://localhost:5188/scalar
```

**Base URL:** `http://localhost:5188/api/pbl3`

**Xác thực:** Thêm header sau vào mọi request cần xác thực:

```
Authorization: Bearer <token>
```

Token nhận được sau khi gọi endpoint đăng nhập `POST /api/pbl3/auth/login`.

---

## Thành viên nhóm

| Họ tên | MSSV | Vai trò |
|--------|------|---------|
|  |  |  |
|  |  |  |
|  |  |  |
