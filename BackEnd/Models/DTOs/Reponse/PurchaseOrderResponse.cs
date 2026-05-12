namespace Backend.Models.DTOs.Reponse
{
    public class POCreateResponse
    {
        public Guid POID { get; set; }
        public int StoreID { get; set; }
        public int SupplierID { get; set; }
        public decimal TaxRate { get; set; }
        public decimal Total { get; set; }
        public PO_Status POStatus { get; set; }
        public List<PODetailResponse> Items { get; set; } = new();
    }

    public class PODetailResponse
    {
        public int IngredientID { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPriceExpected { get; set; }
    }
}
