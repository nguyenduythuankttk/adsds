using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {

    public class DeliveryInfo {
        [Key]
        public Guid DeliveryID { get; set; }
        public Guid BillID { get; set; }
        [ForeignKey("BillID")]
        public virtual Bill Bill { get; set; } = null!;
        public Guid UserID {get; set;}
        [ForeignKey("UserID")]
        public virtual User User{get; set;}
        public Guid AddressID { get; set; }
        [ForeignKey("AddressID")]
        public virtual Address Address { get; set; } = null!;
        [Required]
        public decimal ShippingFee { get; set; }
        public string? Note { get; set; }
        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<DeliveryLog> DeliveryLog { get; set; } = new List<DeliveryLog>();
    }
}
