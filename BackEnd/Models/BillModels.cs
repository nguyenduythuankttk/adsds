using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public enum PaymentMethods
    {
        Cash,
        Card
    }
    public class Bill
    {
        [Key] //khóa chính
        public Guid BillID { get; set; }

        public Guid UserID { get; set; }

        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;

        public int StoreID { get; set; }

        [ForeignKey("StoreID")]
        public virtual Store Store { get; set; } = null!;
        [Required]
        public decimal VAT { get; set; } = 0.1m;
        [Required]
        public PaymentMethods PaymentMethods { get; set; }
        public string? Note { get; set; }
        public Guid? TicketID {get; set;} 
        [ForeignKey("TicketID")]
        public virtual Ticket? Ticket {get; set;}
        [Required]
        public decimal Total { get; set; }
        [Required]
        public decimal MoneyReceived {get; set; }
        [Required]
        public decimal MoneyGiveBack {get; set; }

        public int? TableID { get; set; }

        [ForeignKey("TableID")]
        [JsonIgnore]
        public virtual DiningTable? Table { get; set; }

        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<BillDetail> BillDetail { get; set; } = new List<BillDetail>();

        [JsonIgnore]
        public virtual ICollection<BillChange> BillChange { get; set; } = new List<BillChange>();

    }
}
