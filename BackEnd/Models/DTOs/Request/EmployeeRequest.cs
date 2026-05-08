using Backend.Models;

namespace Backend.Models.DTOs.Request
{
    public class EmployeeCreateRequest
    {
        public string UserName { get; set; } = null!;
        public string HashPassword { get; set; } = null!;
        public DateOnly BirthDate { get; set; }
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public Gender Gender { get; set; }
        
        public RoleType Role { get; set; }
        public int StoreID { get; set; }
        public decimal BasicSalary { get; set; }
    }

    public class EmployeeUpdateRequest
    {
        public string? UserName { get; set; }
        public string? HashPassword { get; set; }
        public DateOnly? BirthDate { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? FullName { get; set; }
        public Gender? Gender { get; set; }
        
        public RoleType? Role { get; set; }
        public int? StoreID { get; set; }
        public decimal? BasicSalary { get; set; }
    }
}
