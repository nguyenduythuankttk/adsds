using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IEmailService {
        Task SendVerifyEmail(string email, string verifytoken);
        Task SendChangePasswordEmail(string email, string resetToken);
    }
}