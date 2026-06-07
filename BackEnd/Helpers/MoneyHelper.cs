namespace Backend.Helpers
{
    // Tiện ích làm tròn tiền tệ (VND).
    public static class MoneyHelper
    {
        // Làm tròn số tiền đến hàng đơn vị (đồng), chỉ loại bỏ phần thập phân lẻ.
        // VD: 76.500,123đ -> 76.500đ, 71.500đ giữ nguyên 71.500đ.
        public static decimal Round(decimal amount)
            => Math.Round(amount, 0, MidpointRounding.AwayFromZero);
    }
}
