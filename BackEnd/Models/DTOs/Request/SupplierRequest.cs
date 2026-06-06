namespace Backend.Models.DTOs.Request
{
    public class SupplierCreateRequest
    {

        public string SupplierName{get; set;} = null!;
        public string Phone{get; set;} = null!;
        public string Email{get; set;} = null!;
        public string TaxCode{get; set;} = null!;
        // Danh sách nguyên liệu mà NCC này cung cấp (dùng để lọc NCC khi lập PO).
        public List<int> IngredientIDs{get; set;} = new();

    }
    public class SupplierUpdateRequest
    {
        public string? SupplierName{get; set;}
        public string? Phone{get; set;}
        public string? Email{get; set;}
        public string? TaxCode{get; set;}
        // Khi != null sẽ đồng bộ lại toàn bộ danh sách nguyên liệu của NCC.
        public List<int>? IngredientIDs{get; set;}

    }
}