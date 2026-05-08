using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IAuthService{
        Task Register(RegisterRequest request);
        Task<EmployeeAuthReponse> EmployeeLogin (LoginRequest request);
        Task <UserAuthReponse> UserLogin (LoginRequest request);
        Task Logout (string accessToken);
        Task ChangePassword(PasswordRequest request, Guid userID);
        Task VerifyEmail(string token);
        Task<bool> ResendVerificationEmail(string email);
        Task<bool> ForgotPassword(string email);
        Task ResetPassword(ResetPasswordRequest request);
    }
}
