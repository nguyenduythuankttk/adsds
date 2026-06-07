namespace Backend.Models.DTOs.Reponse
{
    // Tình trạng còn hàng của từng ProductVarient theo tồn kho 1 cửa hàng.
    // Tính theo đúng logic BillService.ConsumeIngredients: chỉ dùng lô đã sơ chế
    // (Processed), còn Available, chưa hết hạn, thuộc kho của store.
    public class ProductAvailabilityResponse
    {
        public int ProductVarientID { get; set; }
        public bool IsAvailable { get; set; }
        // Số phần tối đa có thể bán với tồn kho hiện tại.
        // 0 = hết hàng (gồm cả món thường chưa khai báo nguyên liệu).
        // -1 = không giới hạn (công thức không tiêu hao nguyên liệu nào).
        public decimal MaxServings { get; set; }
    }
}
