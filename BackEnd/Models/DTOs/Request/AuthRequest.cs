namespace Backend.Models.DTOs.Request{
    public class LoginRequest {
        public string UserName {get; set;} = null!;
        public string HashPassword {get; set;} = null!;
    }
    public class RegisterRequest{
        public string UserName {get; set;} = null!;
        public string HashPassword {get; set;} = null!;
        public string FullName {get; set;} = null!;
        public DateOnly BirthDate {get; set;}
        public string Phone {get; set;} = null!;
        public string Email {get; set;} = null!;
        public Gender Gender {get; set;} 
    }
    public class PasswordRequest{
        public string currentPass {get; set;}
        public string newPass {get; set;}
    }

    public class ForgotPasswordRequest {
        public string Email { get; set; } = null!;
    }

    public class ResetPasswordRequest {
        public string Token { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class VerifyOtpRequest {
        public string Otp { get; set; } = null!;
    }

}