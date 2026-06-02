namespace Backend.Models.DTOs.Reponse
{
    public class ComboDetailResponse
    {
        public int ComboID { get; set; }
        public string ComboName { get; set; } = "";
        public string? Image { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public List<ComboItemResponse> Items { get; set; } = new();
    }

    public class ComboItemResponse
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; } = "";
        public string? Image { get; set; }
        public string? Description { get; set; }
        public ProductType ProductType { get; set; }
        public decimal Qty { get; set; }
        public decimal? UnitPrice { get; set; }
    }
}
