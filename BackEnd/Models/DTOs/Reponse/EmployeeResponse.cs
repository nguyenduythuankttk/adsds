using Backend.Models;

namespace Backend.Models.DTOs.Reponse
{
    public class EmployeeResponse
    {
        public Guid UserID { get; set; }
        public string UserName { get; set; } = null!;
        public DateOnly Birthday { get; set; }
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public Gender Gender { get; set; }
        
        public RoleType Role { get; set; }
        public int StoreID { get; set; }
        public decimal BasicSalary { get; set; }
        
        public StoreResponse? Store { get; set; }
    }
}
