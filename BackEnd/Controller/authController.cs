using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
            var user = await _UserService.GetUserByID(ClaimsHelper.GetUserId(User));
            return Ok(user);
        }

        [Authorize]
        [HttpGet("me/employee")]
        public async Task<IActionResult> GetCurrentEmployee(){
            var emp = await _EmployeeSevice.GetEmployeeByID(ClaimsHelper.GetUserId(User));
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
            return Ok(new {
                message = emailSent
                    ? "Email xác thực đã được gửi lại."
                    : "Không thể gửi email. Vui lòng kiểm tra cấu hình email."
            });
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
            return Ok(new {
                message = emailSent
                    ? "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư."
                    : "Không thể gửi email. Vui lòng kiểm tra cấu hình email."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request){
            await _AuthService.ResetPassword(request);
            return Ok(new { message = "Mật khẩu đã được đặt lại thành công." });
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] PasswordRequest request){
            await _AuthService.ChangePassword(request, ClaimsHelper.GetUserId(User));
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
    }
}
