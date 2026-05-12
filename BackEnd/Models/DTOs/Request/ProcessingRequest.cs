namespace Backend.Models.DTOs.Request
{
    public class CreateProcessingRequest
    {
        public Guid EmployeeID { get; set; }
        public int WarehouseID { get; set; }
        public string? Note { get; set; }
        public List<ProcessingItem> Items { get; set; } = [];
    }

    public class ProcessingItem
    {
        public Guid SourceBatchID { get; set; }
        public decimal InputKg { get; set; }
        public int OutputIngredientID { get; set; }
        public int OutputPieces { get; set; }
        public int BagCount { get; set; }
        public int PiecesPerBag { get; set; }
        public DateOnly Mfd { get; set; }
        public DateOnly Exp { get; set; }
        public string? WasteNote { get; set; }
    }
}
