using System.Linq.Expressions;
using System.Security.Claims;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class userController : ControllerBase
    {
        private readonly IUserService _userService;

        public userController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllUsers()
        {
            return Ok(await _userService.GetAllUsers());
        }

        [HttpGet("get/{userID}")]
        public async Task<IActionResult> GetUserByID(Guid userID)
        {
            var user = await _userService.GetUserByID(userID);
            if (user == null) return NotFound("User not found!");
            return Ok(user);
        }

        // Tra cứu khách theo SĐT khi nhân viên lập hóa đơn. Trả PhoneLookupResponse nếu tìm
        // thấy (tài khoản đã đăng ký hoặc khách vãng lai đã từng mua), 404 nếu là khách mới.
        [HttpGet("lookup-by-phone/{phone}")]
        public async Task<IActionResult> LookupByPhone(string phone)
        {
            var result = await _userService.LookupByPhone(phone);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            await _userService.AddUser(user);
            return Ok("Add user successfully!");
        }

        [Authorize]
        [HttpPut("Update/{userID}")]
        public async Task<IActionResult> UpdateUser(Guid userID, UserUpdateRequest request)
        {
            var tokenUserID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (tokenUserID == null || !Guid.TryParse(tokenUserID, out var parsedID) || parsedID != userID)
                return Forbid();

            try
            {
                await _userService.UpdateUser(userID, request);
                return Ok("Update user succesfully!");
            }
            catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in userController.UpdateUser {ex.Message}");
            }
        }

        [HttpDelete("Delete/{userID}")]
        public async Task<IActionResult> SoftDeleteUser(Guid userID)
        {
            await _userService.SoftDeleteUser(userID);
            return Ok("Delete user successfully!");
        }
    }
}
