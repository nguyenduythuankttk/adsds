namespace Backend.Helpers
{
    // Tính phí giao hàng theo khoảng cách. Dùng CHUNG cho endpoint hiển thị phí
    // (StoreService.GetShippingFee) và lúc tạo đơn (BillService.CreateDeliveryBill)
    // để phí hiển thị luôn khớp phí thực thu — tránh lệch khi sửa công thức ở 1 nơi.
    public static class ShippingHelper
    {
        // Khoảng cách giao tối đa (km). Xa hơn ⇒ không giao.
        public const double MaxDeliveryKm = 50.0;

        // Phí ship tối thiểu (đồng). Giao rất gần (cùng quận, ~0 km) vẫn thu mức nền này
        // thay vì hiện 0đ.
        public const decimal MinFee = 15000m;

        // Phí = khoảng cách × đơn giá theo bậc, nhưng không thấp hơn MinFee.
        public static decimal Fee(double distanceKm)
        {
            decimal rate = distanceKm < 4 ? 15000m : distanceKm <= 10 ? 17000m : 21000m;
            decimal fee = (decimal)distanceKm * rate;
            if (fee < MinFee) fee = MinFee;
            return MoneyHelper.Round(fee);
        }
    }
}
