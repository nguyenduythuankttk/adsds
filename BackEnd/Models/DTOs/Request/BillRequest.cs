using Backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class DineInBillCreateRequest{
        public string? contact  {get;set;}
        public int StoreID { get; set; }
        public int? TableID { get; set; }
        public PaymentMethods PaymentMethods { get; set; }
        public string? Note { get; set; }
        public decimal MoneyReceived {get; set; }
        public decimal MoneyGiveBack {get; set; }
        public Guid? EmployeID {get; set;}
        public List <Booking_product> products {get; set;} = new();
        public Guid TicketID {get; set;}
    }
    public class DeliveryBillCreateRequest
    {
        public Guid UserID {get; set;}
        public int StoreID {get; set;}
        public Guid AddressID {get; set;}
        public PaymentMethods PaymentMethods { get; set; }
        public string? Note { get; set; }
        public string? NoteForDelivery {get; set;}
        public decimal MoneyReceived {get; set; }
        public decimal MoneyGiveBack {get; set; }
        public Guid? EmployeID {get; set;}
        public List <Booking_product> products {get; set;} = new();
        public Guid TicketID {get; set;}
    }
    public class Booking_product
    {
        [Required]
        public int ProductVarientID{get; set;}
        [Range(1,int.MaxValue)]
        public int qty{get; set;}
    }
    public class BillChangeRequest{
        public Guid BillID{get; set;}
        public Guid EmployeeID {get; set;}
        public DateTime ChangeAt {get; set;} = DateTime.UtcNow;
        public BillStatus Status {get; set;}
    }
}