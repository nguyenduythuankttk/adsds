using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    // Bảng nối many-to-many: 1 nhà cung cấp có thể cung cấp nhiều nguyên liệu,
    // 1 nguyên liệu có thể được nhiều nhà cung cấp cung cấp.
    // Dùng để lọc NCC theo nguyên liệu khi lập đơn mua hàng (PO).
    public class SupplierIngredient {
        public int SupplierID { get; set; }
        [ForeignKey("SupplierID")]
        [JsonIgnore]
        public virtual Supplier Supplier { get; set; } = null!;

        public int IngredientID { get; set; }
        [ForeignKey("IngredientID")]
        [JsonIgnore]
        public virtual Ingredient Ingredient { get; set; } = null!;
    }
}
