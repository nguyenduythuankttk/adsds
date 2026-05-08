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
        private readonly ILogger<authController> _logger;

        public authController (
            IAuthService authService,
            IUserService userService,
            IEmployeeService employeeService,
            ILogger<authController> logger
        ){
            _AuthService = authService;
            _EmployeeSevice = employeeService;
            _UserService = userService;
            _logger = logger;
        }

        [HttpPost("customer_login")]
        public async Task<IActionResult> CustomerLogin([FromBody] LoginRequest request){
            try{
                var reponse = await _AuthService.UserLogin(request);
                if (reponse == null) {
                    return Unauthorized("Sai tên đăng nhập hoặc mật khẩu");
                }
                return Ok(new { message = "Đăng nhập thành công!", data = reponse });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.Login");
            }
        }

        [HttpPost("employee_login")]
        public async Task<IActionResult> EmployeeLogin([FromBody] LoginRequest request){
            try{
                var reponse = await _AuthService.EmployeeLogin(request);
                return Ok(new { message = "Đăng nhập thành công!", data = reponse });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.Login");
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(){
            try{
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();
                await _AuthService.Logout(token);
                return Ok("Đăng xuất thành công");
            }catch (Exception){
                return StatusCode(500, "Error in authController.logout");
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser(){
            try{
                var authHeader = Request.Headers["Authorization"].ToString();
                _logger.LogInformation("[auth/me] Authorization header: '{Header}'",
                    string.IsNullOrEmpty(authHeader) ? "(missing)" : authHeader[..Math.Min(authHeader.Length, 40)] + "...");
                _logger.LogInformation("[auth/me] IsAuthenticated={IsAuth} Claims={Claims}",
                    User.Identity?.IsAuthenticated,
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

                var userID = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation("[auth/me] NameIdentifier claim = '{UserID}'", userID);

                if (string.IsNullOrWhiteSpace(userID)) return Unauthorized(new {Message = "Invalid token claims"});
                var user = await _UserService.GetUserByID(Guid.Parse(userID));
                return Ok(user);
            }catch(Exception e){
                _logger.LogError(e, "[auth/me] Exception");
                return StatusCode(500, "Error in authController.getcurrentuser");
            }
        }

        [Authorize]
        [HttpGet("me/employee")]
        public async Task<IActionResult> GetCurrentEmployee(){
            try{
                var empID = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(empID)) return Unauthorized();
                var emp = await _EmployeeSevice.GetEmployeeByID(Guid.Parse(empID));
                return Ok(emp);
            }catch(Exception){
                return StatusCode(500, "Error in authController.GetCurrentEmployee");
            }
        }

        /// <summary>Đăng ký tài khoản và gửi email xác thực</summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request){
            try{
                await _AuthService.Register(request);
                return Ok(new { message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản." });
            } catch (InvalidOperationException e){
                return Conflict(new { message = e.Message });
            } catch (Exception e){
                return StatusCode(500, new { message = "Error in authController.Register: " + e.Message });
            }
        }

        /// <summary>Gửi lại email xác thực</summary>
        [HttpPost("resend-verify-email")]
        public async Task<IActionResult> ResendVerifyEmail([FromBody] ForgotPasswordRequest request){
            try{
                var emailSent = await _AuthService.ResendVerificationEmail(request.Email);
                return Ok(new {
                    message = emailSent
                        ? "Email xác thực đã được gửi lại."
                        : "Không thể gửi email. Vui lòng kiểm tra cấu hình email."
                });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.ResendVerifyEmail");
            }
        }

        /// <summary>Xác thực email sau khi nhấn link trong mail</summary>
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token){
            try{
                await _AuthService.VerifyEmail(token);
                return Ok(new { message = "Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ." });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.VerifyEmail");
            }
        }

        /// <summary>Yêu cầu gửi email đặt lại mật khẩu</summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request){
            try{
                var emailSent = await _AuthService.ForgotPassword(request.Email);
                return Ok(new {
                    message = emailSent
                        ? "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư."
                        : "Không thể gửi email. Vui lòng kiểm tra cấu hình email."
                });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.ForgotPassword");
            }
        }

        /// <summary>Đặt lại mật khẩu bằng token từ email</summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request){
            try{
                await _AuthService.ResetPassword(request);
                return Ok(new { message = "Mật khẩu đã được đặt lại thành công." });
            } catch (InvalidOperationException e){
                return BadRequest(new { message = e.Message });
            } catch (Exception){
                return StatusCode(500, "Error in authController.ResetPassword");
            }
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] PasswordRequest request){
            try{
                var userID = User.FindFirstValue("sub");
                if (string.IsNullOrWhiteSpace(userID)) return Unauthorized();
                await _AuthService.ChangePassword(request, Guid.Parse(userID));
                return Ok(new { message = "Đổi mật khẩu thành công." });
            } catch (Exception e){
                return BadRequest(new { message = e.Message });
            }
        }
    }
}
