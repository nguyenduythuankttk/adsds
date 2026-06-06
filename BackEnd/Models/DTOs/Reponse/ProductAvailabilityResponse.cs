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
        // -1 = không giới hạn (món không có công thức nên không tiêu hao nguyên liệu).
        public decimal MaxServings { get; set; }
    }
}
