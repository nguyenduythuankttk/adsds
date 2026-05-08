using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{
    public class Warehouse
    {
        [Key]
        public int WarehouseID { get; set; }

        public int StoreID { get; set; }

        [ForeignKey("StoreID")]
        public virtual Store Store { get; set; } = null!;

        [Required]
        public int Capacity { get; set; }

        [JsonIgnore]
        public virtual ICollection<InventoryBatch> InventoryBatch { get; set; } = new List<InventoryBatch>();
        public DateTime? DeletedAt { get; set; }
    }
}
