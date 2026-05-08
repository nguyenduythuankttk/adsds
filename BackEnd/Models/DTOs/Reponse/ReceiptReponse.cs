namespace Backend.Models.DTOs.Reponse
{
    public class ReceiptResponse
    {
        public List<ReceiptItem> Results {get; set; } = new();
    }

    public class ReceiptItem
    {
        public Guid ReceiptID { get; set; }

        public Guid EmployeeID { get; set; }
        public int StoreID { get; set; }
        public int SupplierID { get; set; }
        public DateTime DateReceive { get; set; }
        public ReceiptStatus Status { get; set; }
    }

    public class ReceipDetail
    {
        public Guid GoodsReceiptID {get; set;}
        public int IngredientID {get; set;}
        public decimal Quantity {get; set;}
        public decimal UnitPrice {get; set;}

    }
}