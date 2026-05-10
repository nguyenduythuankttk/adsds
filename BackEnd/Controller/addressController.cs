using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    [Authorize]
    public class addressController : ControllerBase {
        private readonly IAddressService _addressService;

        public addressController(IAddressService addressService) {
            _addressService = addressService;
        }

        [HttpGet("my-addresses")]
        public async Task<IActionResult> GetMyAddresses() {
            try {
                var userID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var addresses = await _addressService.GetUserAddress(new Backend.Models.User { UserID = userID });
                return Ok(addresses);
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.GetMyAddresses: {e.Message}");
            }
        }

        [HttpGet("get/{addressID}")]
        public async Task<IActionResult> GetAddressByID(Guid addressID) {
            try {
                var address = await _addressService.GetAddressByID(addressID);
                if (address == null) return NotFound("Không tìm thấy địa chỉ");

                var callerID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var role = User.FindFirstValue(ClaimTypes.Role);
                bool isEmployee = role != "Customer";

                if (!isEmployee && address.UserID != callerID)
                    return Forbid();

                return Ok(address);
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.GetAddressByID: {e.Message}");
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddAddress([FromBody] AddressCreateRequest request) {
            try {
                var userID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var address = new Address {
                    HouseNumber = request.HouseNumber,
                    Street = request.Street,
                    Ward = request.Ward,
                    District = request.District,
                    Province = request.Province,
                    Country = request.Country
                };
                await _addressService.AddUserAddress(address, userID);
                return Ok("Thêm địa chỉ thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.AddAddress: {e.Message}");
            }
        }
        [HttpPut("set-default/{addressID}")]
        public async Task<IActionResult> SetDefault(Guid addressID) {
            try {
                var userID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var address = await _addressService.GetAddressByID(addressID);
                if (address == null) return NotFound("Không tìm thấy địa chỉ");
                if (address.UserID != userID) return Forbid();

                await _addressService.SetDefault(addressID, userID);
                return Ok("Đặt địa chỉ mặc định thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.SetDefault: {e.Message}");
            }
        }
        [HttpDelete("delete/{addressID}")]
        public async Task<IActionResult> DeleteAddress(Guid addressID) {
            try {
                var userID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var address = await _addressService.GetAddressByID(addressID);
                if (address == null) return NotFound("Không tìm thấy địa chỉ");
                if (address.UserID != userID) return Forbid();

                await _addressService.DeleteUserAddress(addressID, userID);
                return Ok("Xóa địa chỉ thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.DeleteAddress: {e.Message}");
            }
        }
    }
}
