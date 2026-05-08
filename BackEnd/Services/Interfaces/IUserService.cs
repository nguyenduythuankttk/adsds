using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Reponse;

namespace Backend.Services.Interface
{
    public interface IUserService
    {
        Task<List<UserResponse>?> GetAllUsers();
        Task<UserResponse?> GetUserByID(Guid userID);
        Task AddUser(User User);
        Task UpdateUser(Guid userID, UserUpdateRequest request);
        Task SoftDeleteUser(Guid userID);
    }
}