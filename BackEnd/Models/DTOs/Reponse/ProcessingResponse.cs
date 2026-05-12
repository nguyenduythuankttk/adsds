namespace Backend.Models.DTOs.Reponse
{
    public class CreateProcessingResponse
    {
        public Guid ProcessingID { get; set; }
        public DateTime ProcessedAt { get; set; }
        public List<ProcessingResultLine> Results { get; set; } = [];
    }

    public class ProcessingResultLine
    {
        public Guid SourceBatchID { get; set; }
        public decimal InputKg { get; set; }
        public Guid OutputBatchID { get; set; }
        public int OutputPieces { get; set; }
        public decimal OutputUnitCost { get; set; }
    }
}
