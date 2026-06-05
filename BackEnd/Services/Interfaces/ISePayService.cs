using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface ISePayService
    {
        /// <summary>
        /// Xử lý 1 giao dịch ghi có nhận từ SePay webhook.
        /// Trả về true nếu khớp & cập nhật bill thành Paid; false nếu bỏ qua (đã xử lý / không khớp / sai tiền).
        /// Luôn KHÔNG throw để controller có thể trả 200 OK cho SePay (idempotency / không cho retry vô hạn).
        /// </summary>
        Task<bool> HandleIncomingTransaction(SePayWebhookPayload payload);

        /// <summary>
        /// Chủ động kiểm tra 1 bill đã nhận được tiền chưa (khi user bấm "Tôi đã chuyển khoản").
        /// Query SePay userapi tìm giao dịch khớp PaymentReference + số tiền; nếu thấy thì đánh
        /// dấu bill Paid (dùng chung logic với webhook). Trả về true nếu bill đã/được xác nhận Paid.
        /// </summary>
        Task<bool> VerifyBillPaymentAsync(Guid billID);
    }
}
