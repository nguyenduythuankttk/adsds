using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum RoleType
    {
        Manager,
        Dining,
        Kitchen,
        Counter
    }

    public class Employee : User
    {
        [Required]
        public RoleType Role { get; set; }
        public int StoreID { get; set; }
        [ForeignKey(nameof(StoreID))]
        public virtual Store Store { get; set; } = null!;
        [JsonIgnore]
        public virtual ICollection<Shift> Shift { get; set; } = new List<Shift>();
        [JsonIgnore]
        public virtual ICollection<POApproval> POApproval { get; set; } = new List<POApproval>();
        [JsonIgnore]
        public virtual ICollection<Receipt> Receipt { get; set; } = new List<Receipt>();
        [JsonIgnore]
        public virtual ICollection<ReceiptChange> ReceiptChange{ get; set; } = new List<ReceiptChange>();
        [JsonIgnore]
        public virtual ICollection<DeliveryLog> DeliveryLog { get; set; } = new List<DeliveryLog>();
        [JsonIgnore]
        public virtual ICollection<StockMovement> StockMovement { get; set; } = new List<StockMovement>();
        [Required]
        public decimal BasicSalary { get; set; }
        public DateTime? DeleteAt {get; set;}
    }
}