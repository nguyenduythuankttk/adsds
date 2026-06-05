namespace Backend.Models.DTOs.Request
{
    // Tạo/cập nhật tài khoản ngân hàng cho 1 cửa hàng. StoreID lấy từ URL controller.
    public class BankAccountUpsertRequest
    {
        public string AccountNumber { get; set; } = null!;
        public string BankCode { get; set; } = null!;
        public string AccountHolderName { get; set; } = null!;
    }
}
