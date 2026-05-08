using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Services.Implementations{
    public class AuthService : IAuthService{
        private readonly AppDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext dbContext,
                           IPasswordHasher<User> passwordHasher,
                           IConfiguration configuration,
                           IEmailService emailService){
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _emailService = emailService;
        }

        private string GenerateAcessToken(User user){
            try{
                var jwtKey = _configuration["Jwt:Key"] ?? throw new Exception("JWT Key is not configured");
                var issuer = _configuration["Jwt:Issuer"] ?? throw new Exception("JWT Issuer is not configured");
                var audience = _configuration["Jwt:Audience"] ?? throw new Exception("JWT Audience is not configured");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var claims = new List<Claim>{
                    new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Role, user is Employee emp ? emp.Role.ToString() : "Customer")
                };
                var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "480");
                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
                );
                return new JwtSecurityTokenHandler().WriteToken(token);
            } catch (Exception e){
                Console.WriteLine(e.Message);
                throw new Exception("Can't generate access token");
            }
        }

        private string GenerateSecureToken() => Random.Shared.Next(100000,999999).ToString();

        public async Task Register(RegisterRequest request){
            bool isExisted = await _dbContext.User.AnyAsync(u => request.Email == u.Email ||
                                                                 request.Phone == u.Phone);
            if (isExisted)
                throw new InvalidOperationException("Email hoặc số điện thoại đã tồn tại");

            isExisted = await _dbContext.User.AnyAsync(u => u.UserName == request.UserName);
            if (isExisted)
                throw new InvalidOperationException("Đã tồn tại UserName");

            try{
                var newCustomer = new User{
                    UserName = request.UserName,
                    FullName = request.FullName,
                    BirthDate = request.BirthDate,
                    Phone = request.Phone,
                    Email = request.Email,
                    Gender = request.Gender,
                    IsVerified = false
                };
                newCustomer.HashPassword = BCrypt.Net.BCrypt.HashPassword(request.HashPassword);
                var token = GenerateSecureToken();
                newCustomer.VerifiedExp = DateTime.UtcNow.AddHours(24);
                newCustomer.EmailVerified = token;
                _dbContext.User.Add(newCustomer);
                await _dbContext.SaveChangesAsync();

                try {
                    await _emailService.SendVerifyEmail(request.Email, token);
                } catch (Exception ex) {
                    Console.WriteLine($"[EmailService] SendVerifyEmail failed: {ex.InnerException?.Message ?? ex.Message}");
                }
            } catch (InvalidOperationException){
                throw;
            } catch (Exception e){
                Console.WriteLine(e.InnerException?.Message ?? e.Message);
                throw new Exception(e.InnerException?.Message ?? e.Message);
            }
        }

        public async Task<bool> ResendVerificationEmail(string email) {
            var user = await _dbContext.User.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                throw new InvalidOperationException("Email không tồn tại trong hệ thống");
            if (user.IsVerified)
                throw new InvalidOperationException("Email này đã được xác thực");

            var token = GenerateSecureToken();
            user.EmailVerified = token;
            user.VerifiedExp = DateTime.UtcNow.AddHours(24);
            await _dbContext.SaveChangesAsync();

            try {
                await _emailService.SendVerifyEmail(email, token);
                return true;
            } catch (Exception ex) {
                Console.WriteLine($"[EmailService] SendVerifyEmail failed: {ex.InnerException?.Message ?? ex.Message}");
                return false;
            }
        }

        public async Task<bool> ForgotPassword(string email) {
            var user = await _dbContext.User.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                throw new InvalidOperationException("Email không tồn tại trong hệ thống");

            var token = GenerateSecureToken();
            user.PasswordEmail = token;
            user.PasswordEmailExp = DateTime.UtcNow.AddHours(1);
            await _dbContext.SaveChangesAsync();

            try {
                await _emailService.SendChangePasswordEmail(email, token);
                return true;
            } catch (Exception ex) {
                Console.WriteLine($"[EmailService] SendChangePasswordEmail failed: {ex.InnerException?.Message ?? ex.Message}");
                return false;
            }
        }

        public async Task VerifyEmail(string token) {
            var record = await _dbContext.User.FirstOrDefaultAsync(u => u.EmailVerified == token);
            if (record == null) {
                throw new Exception("OTP khong hop le");
            }
            if (record.VerifiedExp < DateTime.UtcNow){
                _dbContext.User.Remove(record);
                await _dbContext.SaveChangesAsync();
                throw new Exception();
            }
            record.VerifiedExp = null;
            record.EmailVerified = null;
            record.IsVerified = true;
            await _dbContext.SaveChangesAsync();
        }

        public async Task ResetPassword(ResetPasswordRequest request) {
            var user = await _dbContext.User.FirstOrDefaultAsync(u => u.PasswordEmail == request.Token);
            if (user == null)
                throw new InvalidOperationException("Token đặt lại mật khẩu không hợp lệ");
            if (user.PasswordEmailExp < DateTime.UtcNow)
                throw new InvalidOperationException("Token đặt lại mật khẩu đã hết hạn");

            user.HashPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordEmail = null;
            user.PasswordEmailExp = null;
            await _dbContext.SaveChangesAsync();
        }

        public async Task<EmployeeAuthReponse> EmployeeLogin(LoginRequest request){
            var emp = await _dbContext.Employee
                .FirstOrDefaultAsync(e => e.UserName == request.UserName);

            if (emp == null || !BCrypt.Net.BCrypt.Verify(request.HashPassword, emp.HashPassword))
                throw new InvalidOperationException("Sai tên đăng nhập hoặc mật khẩu");

            var accessToken = GenerateAcessToken(emp);

            return new EmployeeAuthReponse{
                AcessToken = accessToken,
                EmployeeID = emp.UserID,
                EmployeeName = emp.FullName,
                Phone = emp.Phone,
                Email = emp.Email,
                StoreID = emp.StoreID,
                Role = emp.Role,
                FullName = emp.FullName,
                BirthDate = emp.BirthDate,
                BasicSalary = emp.BasicSalary
            };
        }

        public async Task<UserAuthReponse> UserLogin(LoginRequest request){
            var usr = await _dbContext.User
                .FirstOrDefaultAsync(e => e.UserName == request.UserName);

            if (usr == null || !BCrypt.Net.BCrypt.Verify(request.HashPassword, usr.HashPassword))
                throw new InvalidOperationException("Sai tên đăng nhập hoặc mật khẩu");

            if (!usr.IsVerified)
                throw new InvalidOperationException("Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.");

            var accessToken = GenerateAcessToken(usr);
            return new UserAuthReponse{
                AcessToken = accessToken,
                UserID = usr.UserID,
                UserName = usr.UserName,
                Phone = usr.Phone,
                Email = usr.Email,
                FullName = usr.FullName,
                BirthDate = usr.BirthDate
            };
        }

        public async Task Logout(string accessToken){
            try{
                if (string.IsNullOrEmpty(accessToken)) return;

                _dbContext.BlackListedToken.Add(new BlacklistedToken{
                    Token = accessToken,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(480)
                });

                await _dbContext.SaveChangesAsync();
            } catch (DbUpdateException){
                // Token đã có trong blacklist — bỏ qua
            }
        }

        public async Task ChangePassword(PasswordRequest request, Guid userID){
            var user = await _dbContext.User.FirstOrDefaultAsync(u => u.UserID == userID);
            if (user == null) throw new Exception("Không tìm thấy người dùng");

            if (!BCrypt.Net.BCrypt.Verify(request.currentPass, user.HashPassword))
                throw new Exception("Sai mật khẩu hiện tại");

            user.HashPassword = BCrypt.Net.BCrypt.HashPassword(request.newPass);
            // Chỉ đánh dấu đúng field thay đổi, tránh conflict EF tracking với Employee
            _dbContext.Entry(user).Property(u => u.HashPassword).IsModified = true;
            await _dbContext.SaveChangesAsync();
        }
    }
}
