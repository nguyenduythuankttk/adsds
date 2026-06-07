namespace Backend.Helpers
{
    // Tiện ích làm tròn tiền tệ (VND).
    public static class MoneyHelper
    {
        // Làm tròn số tiền đến hàng nghìn đồng.
        // VD: 12.450đ -> 12.000đ, 12.500đ -> 13.000đ, 12.501đ -> 13.000đ.
        public static decimal RoundToThousand(decimal amount)
            => Math.Round(amount / 1000m, 0, MidpointRounding.AwayFromZero) * 1000m;
    }
}
