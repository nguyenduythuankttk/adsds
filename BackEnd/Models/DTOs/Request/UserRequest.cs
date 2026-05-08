using Microsoft.AspNetCore.Identity;

namespace Backend.Models.DTOs;

public class UserCreateRequest
{
    public string UserName { get; set; } = null!;
    public string HashPassword { get; set; }  = null!;
    public DateOnly BirthDate { get; set; } 
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string FullName { get; set; } = null!;
}

public class UserUpdateRequest
{
        public string? UserName { get; set; }
        public string? HashPassword { get; set; }
        public DateOnly? BirthDate { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? FullName { get; set; }
        public Gender Gender {get; set; }
}