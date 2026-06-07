using System.Runtime.CompilerServices;
using Backend.Data;
using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Reponse;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
        }

        //Get all User
        public async Task<List<UserResponse>?> GetAllUsers() =>
            await _dbContext.User
                .Where(u => !(u is Employee) && u.DeletedAt == null)
                .AsNoTracking()
                .Include(u => u.Addresses)
                .Select(u => new UserResponse
                {
                    UserID = u.UserID,
                    UserName = u.UserName,
                    Email = u.Email,
                    Phone = u.Phone,
                    FullName = u.FullName,
                    Gender = u.Gender,
                    Birthday = u.BirthDate,
                })
                .ToListAsync();

        public async Task<UserResponse?> GetUserByID(Guid userID) =>
            await _dbContext.User
                .AsNoTracking()
                .Include(u => u.Addresses)
                .Where(u => u.UserID == userID && u.DeletedAt == null)
                .Select(u => new UserResponse
                {
                    UserID = u.UserID,
                    UserName = u.UserName,
                    Email = u.Email,
                    Phone = u.Phone,
                    FullName = u.FullName,
                    Gender = u.Gender,
                    Birthday = u.BirthDate,
                })
                .FirstOrDefaultAsync();

        public async Task AddUser(User user)
        {
            try
            {
                user.IsVerified = false;
                user.HashPassword = BCrypt.Net.BCrypt.HashPassword(user.HashPassword);
                _dbContext.User.Add(user);
                await _dbContext.SaveChangesAsync();
            }catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
        public async Task<User?> GetUserByContact (string contact) =>
            await _dbContext.User.FirstOrDefaultAsync(u => u.Phone == contact || u.Email == contact);

        // Tra cứu khách theo SĐT cho màn lập hóa đơn của nhân viên:
        //   - Khớp tài khoản đã đăng ký  → IsRegistered = true  (kèm UserID để nạp voucher).
        //   - Không có tài khoản nhưng đã từng mua (sổ GuestCustomer) → IsRegistered = false.
        //   - Hoàn toàn mới → trả null (FE hiển thị "Khách mới").
        public async Task<PhoneLookupResponse?> LookupByPhone(string phone)
        {
            var digits = new string((phone ?? "").Where(char.IsDigit).ToArray());
            if (digits.Length < 8) return null;

            var user = await _dbContext.User.AsNoTracking()
                .Where(u => !(u is Employee) && u.DeletedAt == null && u.Phone == digits)
                .Select(u => new { u.UserID, u.FullName, u.Phone })
                .FirstOrDefaultAsync();
            if (user != null)
                return new PhoneLookupResponse {
                    FullName = user.FullName,
                    Phone = user.Phone,
                    UserID = user.UserID,
                    IsRegistered = true
                };

            try {
                var guest = await _dbContext.GuestCustomer.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.Phone == digits);
                if (guest != null)
                    return new PhoneLookupResponse {
                        FullName = guest.Name,
                        Phone = guest.Phone,
                        UserID = null,
                        IsRegistered = false
                    };
            } catch (Exception ex) {
                Console.WriteLine("LookupByPhone: bỏ qua sổ khách lẻ GuestCustomer - " + ex.Message);
            }

            return null;
        }

        public async Task UpdateUser(Guid userID, UserUpdateRequest request)
        {
            var user = await _dbContext.User.FindAsync(userID);

            if(user == null)
                throw new Exception("User not found");

            try
            {
                if(request.BirthDate.HasValue)
                    user.BirthDate = request.BirthDate.Value;

                if(request.UserName != null)
                    user.UserName = request.UserName;
                
                if(request.HashPassword != null)
                    user.HashPassword = BCrypt.Net.BCrypt.HashPassword(request.HashPassword);

                if(request.Email != null)
                    user.Email = request.Email;

                if(request.Phone != null)
                    user.Phone = request.Phone;

                if(request.FullName != null)
                    user.FullName = request.FullName;

                user.Gender = request.Gender;

                await _dbContext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Update User Error: {ex.Message}");
                throw new Exception($"An error occurred while updating the user: {ex.Message}");
            }
        }

        public async Task SoftDeleteUser(Guid userID)
        {
            var user = await _dbContext.User    
                .FirstOrDefaultAsync(u => u.UserID == userID &&
                                          u.DeletedAt == null);

            if(user == null)
            {
                throw new Exception("User not found");
            }

            try
            {
                user.DeletedAt = VnTime.Now;
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Delete user error {ex.Message}");
                throw new Exception($"An error occured while deleting user: {ex.Message}");
            }
        }
        public async Task<int> GetQtyUser() =>
            await _dbContext.User.Where(u => !(u is Employee) && u.DeletedAt == null).CountAsync();
            
    }
}