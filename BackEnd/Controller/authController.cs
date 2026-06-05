using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class authController : ControllerBase {
        private readonly IAuthService _AuthService;
        private readonly IUserService _UserService;
        private readonly IEmployeeService _EmployeeSevice;

        public authController(
            IAuthService authService,
            IUserService userService,
            IEmployeeService employeeService
        ){
            _AuthService = authService;
            _EmployeeSevice = employeeService;
            _UserService = userService;
        }

        [HttpPost("customer_login")]
        public async Task<IActionResult> CustomerLogin([FromBody] LoginRequest request){
            var reponse = await _AuthService.UserLogin(request);
            return Ok(new { message = "Đăng nhập thành công!", data = reponse });
        }

        [HttpPost("employee_login")]
        public async Task<IActionResult> EmployeeLogin([FromBody] LoginRequest request){
            var reponse = await _AuthService.EmployeeLogin(request);
            return Ok(new { message = "Đăng nhập thành công!", data = reponse });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(){
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();
            await _AuthService.Logout(token);
            return Ok("Đăng xuất thành công");
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser(){
            var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (string.IsNullOrWhiteSpace(userID)) return Unauthorized(new { Message = "Invalid token claims" });
            var user = await _UserService.GetUserByID(Guid.Parse(userID));
            return Ok(user);
        }

        [Authorize]
        [HttpGet("me/employee")]
        public async Task<IActionResult> GetCurrentEmployee(){
            var empID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (string.IsNullOrWhiteSpace(empID)) return Unauthorized();
            var emp = await _EmployeeSevice.GetEmployeeByID(Guid.Parse(empID));
            return Ok(emp);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request){
            await _AuthService.Register(request);
            return Ok(new { message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản." });
        }

        [HttpPost("resend-verify-email")]
        public async Task<IActionResult> ResendVerifyEmail([FromBody] ForgotPasswordRequest request){
            var emailSent = await _AuthService.ResendVerificationEmail(request.Email);
            if (!emailSent)
                return StatusCode(500, new { message = "Không thể gửi email. Vui lòng thử lại sau." });
            return Ok(new { message = "Email xác thực đã được gửi lại." });
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token){
            await _AuthService.VerifyEmail(token);
            return Ok(new { message = "Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ." });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request){
            await _AuthService.VerifyEmail(request.Otp);
            return Ok(new { message = "Xác thực thành công. Bạn có thể đăng nhập ngay bây giờ." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request){
            var emailSent = await _AuthService.ForgotPassword(request.Email);
            if (!emailSent)
                return StatusCode(500, new { message = "Không thể gửi email. Vui lòng thử lại sau." });
            return Ok(new { message = "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request){
            await _AuthService.ResetPassword(request);
            return Ok(new { message = "Mật khẩu đã được đặt lại thành công." });
        }

        [Authorize]
        [HttpPost("change-password/request-otp")]
        public async Task<IActionResult> RequestChangePasswordOtp([FromBody] PasswordRequest request){
            try{
                var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value;
                if (string.IsNullOrWhiteSpace(userID)) return Unauthorized();
                await _AuthService.RequestChangePasswordOtp(request, Guid.Parse(userID));
                return Ok(new { message = "Mã OTP đã được gửi về email của bạn." });
            } catch (Exception e){
                return BadRequest(new { message = e.Message });
            }
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordWithOtpRequest request){
            try{
                var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value;
                if (string.IsNullOrWhiteSpace(userID)) return Unauthorized();
                await _AuthService.ChangePasswordWithOtp(request, Guid.Parse(userID));
                return Ok(new { message = "Đổi mật khẩu thành công." });
            } catch (Exception e){
                return BadRequest(new { message = e.Message });
            }
        }
    }
}
