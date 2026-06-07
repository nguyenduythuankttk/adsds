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

        // 1-N: một bàn phục vụ NHIỀU hóa đơn theo thời gian (mỗi lượt khách một bill).
        // KHÔNG để là 1-1 (Bill?) vì sẽ sinh UNIQUE index trên Bill.TableID, khiến hóa
        // đơn thứ hai trên cùng một bàn vi phạm ràng buộc → lỗi 500 ở lần xuất kế tiếp.
        [JsonIgnore]
        public virtual ICollection<Bill> Bills { get; set; } = new List<Bill>();
    }
}
