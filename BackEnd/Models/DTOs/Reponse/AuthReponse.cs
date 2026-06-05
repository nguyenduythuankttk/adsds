using Backend.Models;
namespace Backend.Models.DTOs.Reponse{
    public class AuthReponse{
        public string AcessToken {get; set;} = null!;
    }
    public class EmployeeAuthReponse : AuthReponse {
        public Guid EmployeeID {get; set;}
        public string EmployeeName {get; set;} = null!;
        public int StoreID {get; set;}
        public RoleType Role {get; set;}
        public DateOnly? BirthDate {get; set;}
        public string? Email {get; set;}
        public string Phone {get; set;} = null!;
        public string FullName {get; set;} = null!;
        public Gender Gender {get; set;}
        public decimal BasicSalary { get; set; }
        // Trạng thái ca hôm nay sau khi đăng nhập (đúng giờ / trễ / vắng / không có ca).
        public ShiftCheckInResponse? CurrentShift { get; set; }
    }
    public class UserAuthReponse : AuthReponse{
        public Guid UserID {get; set;}
        public string UserName {get; set;}  = null!;
        public DateOnly? BirthDate {get; set;} 
        public string? Email {get; set;}
        public string Phone {get; set;} = null!;
        public string FullName {get; set;} = null!;
        public Gender Gender {get; set;} 
    }
}