using Backend.Helpers;
using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class DeliveryInfoCreateRequest{
        public Guid BillID { get; set; }
        public Guid UserID {get; set;}
        public Guid EmployeeID { get; set; }
        public Guid AddressID { get; set; }
        public decimal ShippingFee { get; set; }
        public string? Note { get; set; }
    }
    public class DeliveryUpdateRequest{
        public Guid? EmployeeID { get; set; }
        public DeliveryStatus Status { get; set; }
        public DateTime ChangeAt { get; set; } = VnTime.Now;
        public string? Note { get; set; }
        /// <summary>Số tiền khách trả – bắt buộc khi Status = Delivered</summary>
        public decimal? MoneyReceived { get; set; }
    }
}