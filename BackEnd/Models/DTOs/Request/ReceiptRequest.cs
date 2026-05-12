namespace Backend.Models.DTOs.Request
{
    public class ReceiptCreateRequest
    {
        public Guid POID { get; set; }
        public Guid EmployeeID { get; set; }
        public List<ReceiptDetailItem> ReceiptLines { get; set; } = [];
    }

    public class ReceiptDetailItem
    {
        public int IngredientID { get; set; }
        public decimal Quantity { get; set; }       // số kg giao thực tế
        public decimal GoodQuantity { get; set; }   // số kg không bị hỏng
        public decimal UnitPrice { get; set; }      // giá thực tế trên hóa đơn
    }

    public class ConfirmReceiptRequest
    {
        public Guid ReceiptID { get; set; }
        public Guid EmployeeID { get; set; }
        public List<ConfirmReceiptLine> Lines { get; set; } = [];
    }

    public class ConfirmReceiptLine
    {
        public int IngredientID { get; set; }
        public int WarehouseID { get; set; }
        public DateOnly Mfd { get; set; }
        public DateOnly Exp { get; set; }
        public string? BatchCode { get; set; }
    }
}


