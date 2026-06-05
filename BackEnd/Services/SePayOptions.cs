namespace Backend.Services
{
    /// <summary>
    /// Cấu hình tích hợp SePay (test mode).
    /// Đọc từ section "SePay" trong appsettings.Development.json.
    /// </summary>
    public class SePayOptions
    {
        public const string SectionName = "SePay";

        /// <summary>Bật để chỉ chạy ở chế độ test/sandbox – log cảnh báo lúc khởi động.</summary>
        public bool TestMode { get; set; } = true;

        /// <summary>API key copy từ dashboard SePay, dùng làm bearer token xác thực webhook.</summary>
        public string? ApiKey { get; set; }

        /// <summary>
        /// API Access Token (Company → API Access trên dashboard SePay) dùng để CHỦ ĐỘNG
        /// query danh sách giao dịch qua userapi khi user bấm "Tôi đã chuyển khoản".
        /// Khác với ApiKey (chỉ dùng xác thực webhook). Nếu trống thì fallback dùng ApiKey.
        /// </summary>
        public string? ApiToken { get; set; }

        /// <summary>Số TK ngân hàng nhận tiền (cấu hình 1 lần trong .env, mọi cửa hàng dùng chung).</summary>
        public string? Account { get; set; }

        /// <summary>Bank code SePay hỗ trợ (vd: "MB", "VCB", "TCB"...).</summary>
        public string? Bank { get; set; }

        /// <summary>Tên chủ tài khoản nhận tiền (hiển thị trên popup QR).</summary>
        public string? AccountHolderName { get; set; }

        /// <summary>Base URL của SePay userapi (mặc định https://my.sepay.vn).</summary>
        public string BaseUrl { get; set; } = "https://my.sepay.vn";

        /// <summary>Prefix gắn vào mã nội dung CK (vd: "JLB" => "JLB123").</summary>
        public string ReferencePrefix { get; set; } = "JLB";
    }
}
