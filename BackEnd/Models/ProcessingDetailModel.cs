using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class ProcessingDetail
    {
        // Composite PK: (ProcessingID + SourceBatchID)
        public Guid ProcessingID { get; set; }
        [ForeignKey("ProcessingID")]
        [JsonIgnore]
        public virtual ProcessingLog ProcessingLog { get; set; } = null!;

        public Guid SourceBatchID { get; set; }
        [ForeignKey("SourceBatchID")]
        public virtual InventoryBatch SourceBatch { get; set; } = null!;

        // Số kg thực tế lấy từ batch thô để sơ chế
        [Required]
        public decimal InputKg { get; set; }

        // FK → Ingredient loại Unit (ví dụ: "Cánh gà — Unit")
        // Dùng khi tạo InventoryBatch mới để gán đúng loại nguyên liệu
        public int OutputIngredientID { get; set; }
        [ForeignKey("OutputIngredientID")]
        public virtual Ingredient OutputIngredient { get; set; } = null!;

        // Số miếng đếm được thực tế sau khi sơ chế
        [Required]
        public int OutputPieces { get; set; }

        // Metadata đóng túi — cho ops biết khi lấy kho
        [Required]
        public int BagCount { get; set; }
        [Required]
        public int PiecesPerBag { get; set; }

        public string? WasteNote { get; set; }

        // FK → InventoryBatch mới được tạo từ đợt sơ chế này
        public Guid OutputBatchID { get; set; }
        [ForeignKey("OutputBatchID")]
        public virtual InventoryBatch OutputBatch { get; set; } = null!;
    }
}