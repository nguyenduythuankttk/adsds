using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public enum PaymentMethods
    {
        Cash,
        Card,
        BankTransfer
    }

    public enum PaymentStatus
    {
        Pending,
        Paid,
        Failed
    }
    public class Bill
    {
        [Key] //khóa chính
        public Guid BillID { get; set; }

        public Guid? UserID { get; set; }

        [ForeignKey("UserID")]
        public virtual User? User { get; set; } = null!;

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
        public decimal? MoneyReceived {get; set; }
        public decimal? MoneyGiveBack {get; set; }

        // ── SePay / bank-transfer payment tracking ──────────────────────────
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        [MaxLength(32)]
        public string? PaymentReference { get; set; }
        public DateTime? PaidAt { get; set; }
        public long? SePayTransactionId { get; set; }

        public int? TableID { get; set; }

        [ForeignKey("TableID")]
        [JsonIgnore]
        public virtual DiningTable? Table { get; set; }
        public Guid? AddressID {get; set;}
        [ForeignKey("AddressID")]
        [JsonIgnore]
        public virtual Address? Address {get; set;}

        public DateTime? DeletedAt { get; set; }

        public virtual ICollection<BillDetail> BillDetail { get; set; } = new List<BillDetail>();

        public virtual ICollection<BillChange> BillChange { get; set; } = new List<BillChange>();
        [JsonIgnore]
        public virtual DeliveryInfo? DeliveryInfo { get; set; }
    }
}
