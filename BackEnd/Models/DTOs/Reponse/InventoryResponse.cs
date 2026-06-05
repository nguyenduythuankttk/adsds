using Backend.Models;

namespace Backend.Models.DTOs.Reponse
{
    // Lô hàng trong kho của store, phẳng để FE render trực tiếp.
    public class InventoryBatchResponse
    {
        public Guid BatchID { get; set; }
        public string? BatchCode { get; set; }
        public int WarehouseID { get; set; }
        public int StoreID { get; set; }
        public string? StoreName { get; set; }
        public int IngredientID { get; set; }
        public string IngredientName { get; set; } = "";
        public string IngredientUnit { get; set; } = "";
        public BatchType BatchType { get; set; }
        public BatchStatus Status { get; set; }
        public decimal QuantityOriginal { get; set; }
        public decimal QuantityOnHand { get; set; }
        public decimal UnitCost { get; set; }
        public DateTime ImportDate { get; set; }
        public DateOnly Mfd { get; set; }
        public DateOnly Exp { get; set; }
    }

    // Một dòng tổng hợp tồn kho theo nguyên liệu cho 1 store.
    public class InventoryIngredientSummary
    {
        public int IngredientID { get; set; }
        public string IngredientName { get; set; } = "";
        public string IngredientUnit { get; set; } = "";
        public decimal TotalOnHand { get; set; }
        public int BatchCount { get; set; }
        public int ExpiringCount { get; set; }   // ≤ 7 ngày
        public int ExpiredCount { get; set; }
        public decimal TotalValue { get; set; }
    }

    public class WarehouseUsageResponse
    {
        public int WarehouseID { get; set; }
        public int StoreID { get; set; }
        public string? StoreName { get; set; }
        public int Capacity { get; set; }
        public decimal CurrentLoad { get; set; }
        public int BatchCount { get; set; }
    }

    // Tổng hợp toàn store: dùng cho dashboard "Kiểm Tra Kho".
    public class StoreInventoryReport
    {
        public int StoreID { get; set; }
        public string? StoreName { get; set; }
        public int WarehouseCount { get; set; }
        public int TotalBatches { get; set; }
        public int AvailableBatches { get; set; }
        public int ExpiringBatches { get; set; }
        public int ExpiredBatches { get; set; }
        public decimal TotalValue { get; set; }
        public List<WarehouseUsageResponse> Warehouses { get; set; } = new();
        public List<InventoryIngredientSummary> Ingredients { get; set; } = new();
    }
}
