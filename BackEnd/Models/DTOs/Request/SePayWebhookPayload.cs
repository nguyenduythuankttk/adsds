namespace Backend.Models.DTOs.Request
{
    /// <summary>
    /// Payload SePay gửi tới webhook khi có giao dịch ngân hàng.
    /// Tham chiếu: https://docs.sepay.vn/tich-hop-webhooks.html
    /// </summary>
    public class SePayWebhookPayload
    {
        public long Id { get; set; }                       // id giao dịch SePay (duy nhất)
        public string? Gateway { get; set; }               // Tên ngân hàng (vd "Vietcombank", "MBBank")
        public string? TransactionDate { get; set; }       // yyyy-MM-dd HH:mm:ss
        public string? AccountNumber { get; set; }         // số TK nhận
        public string? Code { get; set; }                  // mã code SePay tự phát hiện (nếu có)
        public string? Content { get; set; }               // Nội dung CK – chứa PaymentReference
        public string? TransferType { get; set; }          // "in" hoặc "out"
        public decimal TransferAmount { get; set; }        // Số tiền giao dịch
        public decimal Accumulated { get; set; }           // Số dư sau giao dịch
        public string? SubAccount { get; set; }
        public string? ReferenceCode { get; set; }         // Mã ref từ ngân hàng (vd "FT2412...")
        public string? Description { get; set; }
    }
}
