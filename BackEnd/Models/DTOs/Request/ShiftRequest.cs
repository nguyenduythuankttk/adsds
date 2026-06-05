using Backend.Helpers;
using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class ShiftCreateRequest {
        public Guid EmployeeID {get; set;}
        public DateTime TimeIn {get; set;}
        public DateTime TimeOut {get; set;}
    }
    public class ShiftUpdateRequest {
        public DateTime? CheckIn {get; set;} = VnTime.Now;
        public DateTime? CheckOut {get; set;} = VnTime.Now;
    }

    // Admin tạo ca làm cho nhân viên trong cùng storeID. Time là local datetime
    // (sẽ được service convert sang UTC). EmployeeID phải thuộc storeID truyền vào URL.
    public class ShiftAssignRequest {
        public Guid EmployeeID {get; set;}
        public DateTime TimeIn {get; set;}
        public DateTime TimeOut {get; set;}
    }
}
