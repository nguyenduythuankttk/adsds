using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
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

        [HttpPost("add")]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            await _userService.AddUser(user);
            return Ok("Add user successfully!");
        }

        [HttpPut("Update/{userID}")]
        public async Task<IActionResult> UpdateUser(Guid userID, UserUpdateRequest request)
        {
            await _userService.UpdateUser(userID, request);
            return Ok("Update user successfully!");
        }

        [HttpDelete("Delete/{userID}")]
        public async Task<IActionResult> SoftDeleteUser(Guid userID)
        {
            await _userService.SoftDeleteUser(userID);
            return Ok("Delete user successfully!");
        }
    }
}
