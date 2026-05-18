using Backend.Models;
namespace Backend.Models.DTOs.Request{
    public class POCreateRequest{
        public int StoreID { get; set; }
        public int SupplierID { get; set; }
        public Guid EmployeeID { get; set; }
        public decimal TaxRate { get; set; }
        public string? Comment { get; set; }
        public List<PODetailItem> Items { get; set; } = new();
    }

    public class PODetailItem{
        public int IngredientID { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPriceExpected { get; set; }
    }

    public class POUpdateRequest{
        public Guid EmployeeID { get; set; }
        public PO_Status POStatus { get; set; }
        public string? Comment { get; set; }
        public string? CancelledReason { get; set; }
    }
}