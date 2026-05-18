using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public enum TableStatus {
        Available,
        Reserved,
        Occupied
    }
    public class DiningTable {
        [Key]
        public int TableID { get; set; }
        public int StoreID { get; set; }
        [ForeignKey("StoreID")]
        public virtual Store Store { get; set; } = null!;
        [Required]
        public int TableNumber { get; set; }
        [Required]
        public int Capacity { get; set; }
        [Required]
        public TableStatus Status { get; set; } = TableStatus.Available;
        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual Bill? Bill { get; set; }
    }
}
