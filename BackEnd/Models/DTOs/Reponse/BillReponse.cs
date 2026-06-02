using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Reponse{
    public class BillReponse{
        public Guid BillID { get; set; }
        public StoreResponse Store { get; set; } = null!;
        public AddressResponse? Address { get; set; }
        public List<BillDetailReponse> Detail { get; set; } = new();
        public List<BillChangeReponse> BillChange { get; set; } = new();
        public decimal VAT { get; set; }
        public decimal Total { get; set; }
        public decimal? MoneyReceived { get; set; }
        public decimal? MoneyGiveBack { get; set; }
        public string? Note { get; set; }
        public PaymentMethods PaymentMethods { get; set; }
        public int? TableID { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string? PaymentReference { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    // Trả về cho FE ngay sau khi tạo bill BankTransfer
    public class DeliveryBillCreateReponse{
        public Guid BillID { get; set; }
        public decimal Total { get; set; }
        public PaymentMethods PaymentMethods { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string? PaymentReference { get; set; }
        public string? QrUrl { get; set; }
        public string? BankAccount { get; set; }
        public string? BankCode { get; set; }
        public bool TestMode { get; set; }
    }

    public class DineInBillCreateReponse{
        public Guid BillID { get; set; }
        public decimal Total { get; set; }
        public PaymentMethods PaymentMethods { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string? PaymentReference { get; set; }
        public string? QrUrl { get; set; }
        public string? BankAccount { get; set; }
        public string? BankCode { get; set; }
        public bool TestMode { get; set; }
    }

    public class PaymentStatusReponse{
        public Guid BillID { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public DateTime? PaidAt { get; set; }
    }
    public class BillChangeReponse{
        public BillStatus Status { get; set; }
        public DateTime ChangeAt { get; set; }
    }
    public class BillDetailReponse{
        public int ProductVarientID { get; set; }

        [ForeignKey("ProductVarientID")]
        public virtual ProductVarient ProductVarient { get; set; } = null!;
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal InlineTotal { get; set; }
    }
}
