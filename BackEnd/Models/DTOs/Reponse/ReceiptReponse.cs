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

    // Dữ liệu prefill khi nhân viên bấm "Tạo phiếu nhập từ PO"
    public class ReceiptPrefillResponse
    {
        public Guid POID { get; set; }
        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = "";
        public int StoreID { get; set; }
        public List<ReceiptDetailPrefill> PODetailLines { get; set; } = [];
    }

    // Mỗi dòng trong prefill = 1 nguyên liệu từ PODetail, nhân viên sẽ điền Quantity/GoodQuantity/UnitPrice thực tế
    public class ReceiptDetailPrefill
    {
        public int IngredientID { get; set; }
        public string IngredientName { get; set; } = "";
        public decimal QuantityExpected { get; set; }
        public decimal UnitPriceExpected { get; set; }
    }

    public class ReceiptCreateResponse
    {
        public Guid ReceiptID { get; set; }
        public Guid POID { get; set; }
        public int SupplierID { get; set; }
        public int StoreID { get; set; }
        public Guid EmployeeID { get; set; }
        public DateTime DateReceive { get; set; }
        public List<ReceiptDetailSaved> ReceiptDetailLines { get; set; } = [];
    }

    // Mỗi dòng đã lưu vào DB sau khi tạo Receipt
    public class ReceiptDetailSaved
    {
        public int IngredientID { get; set; }
        public decimal Quantity { get; set; }
        public decimal GoodQuantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class ConfirmReceiptResponse
    {
        public Guid ReceiptID { get; set; }
        public DateTime ConfirmedAt { get; set; }
        public List<BatchCreatedLine> BatchesCreated { get; set; } = [];
    }

    public class BatchCreatedLine
    {
        public Guid BatchID { get; set; }
        public int IngredientID { get; set; }
        public string IngredientName { get; set; } = "";
        public decimal QuantityOnHand { get; set; }
        public string BatchCode { get; set; } = "";
    }
}