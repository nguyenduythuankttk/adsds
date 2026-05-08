using System.Linq.Expressions;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Request;
using Backend.Services.Implementations;
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
            try
            {
                var users = await _userService.GetAllUsers();
                return Ok(users);    
            } catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in userController.GetAllUsers {ex.Message}");
            }
        }

        [HttpGet("get/{userID}")]
        public async Task<IActionResult> GetUserByID(Guid userID)
        {
            try
            {
                var user = await _userService.GetUserByID(userID);
                
                if(user == null)
                    return NotFound("User not found!");

                return Ok(user);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in userController.GetUserByID {ex.Message}");
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            try
            {
                await _userService.AddUser(user);
                return Ok("Add user succesfully!");
            } catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in userController.AddUser {ex.Message}");
            }
        } 

        [HttpPut("Update/{userID}")]
        public async Task<IActionResult> UpdateUser(Guid userID, UserUpdateRequest request)
        {
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
            try
            {
                await _userService.SoftDeleteUser(userID);
                return Ok("Delete user succesfully!");
            } catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in userController.SoftDeleteUser {ex.Message}");
            }
        }
    }
}