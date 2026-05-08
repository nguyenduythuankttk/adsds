using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class BillCreateRequest{
        public Guid UserID { get; set; }
        public int StoreID { get; set; }
        public decimal VAT { get; set; }
        public PaymentMethods PaymentMethods { get; set; }
        public decimal Total { get; set; }
        public decimal Paid {get; set;}
        public string? Note { get; set; }
        public decimal MoneyReceived {get; set; }
        public decimal MoneyGiveBack {get; set; }
        public Guid EmployeID {get; set;}
    }
    public class BillChangeRequest{
        public Guid BillID{get; set;}
        public Guid EmployeeID {get; set;}
        public DateTime ChangeAt {get; set;} = DateTime.UtcNow;
        public BillStatus Status {get; set;}
    }
}