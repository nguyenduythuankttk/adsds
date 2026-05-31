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

        /// <summary>Số TK ảo (virtual account) đã tạo trong SePay test mode.</summary>
        public string? Account { get; set; }

        /// <summary>Bank code SePay hỗ trợ (vd: "MB", "VCB", "TCB"...).</summary>
        public string? Bank { get; set; }

        /// <summary>Prefix gắn vào mã nội dung CK (vd: "JLB" => "JLB123").</summary>
        public string ReferencePrefix { get; set; } = "JLB";
    }
}
