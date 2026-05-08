using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class ShiftCreateRequest {
        public Guid EmployeeID {get; set;}
        public DateTime TimeIn {get; set;}
        public DateTime TimeOut {get; set;}
    }
    public class ShiftUpdateRequest {
        public DateTime? CheckIn {get; set;} = DateTime.UtcNow;
        public DateTime? CheckOut {get; set;} = DateTime.UtcNow;
    }
}