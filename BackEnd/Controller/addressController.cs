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
            var userID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var addresses = await _addressService.GetUserAddress(new User { UserID = userID });
            return Ok(addresses);
        }

        [HttpGet("get/{addressID}")]
        public async Task<IActionResult> GetAddressByID(Guid addressID) {
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");

            var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            bool isEmployee = role != "Customer";

            if (!isEmployee && address.UserID != callerID)
                return Forbid();

            return Ok(address);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddAddress([FromBody] AddressCreateRequest request) {
            try {
                var userID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value)!);
                var address = new Address {
                    StreetAddress = request.StreetAddress,
                    District = request.District,
                    Province = request.Province
                };
                await _addressService.AddUserAddress(address, userID);
                return Ok(new { addressID = address.AddressID });
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.AddAddress: {e.Message}");
            }
        }

        // Staff (Manager/Counter) tạo địa chỉ cho khách hàng bất kỳ — phục vụ lập hóa đơn giao hàng tại quầy.
        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("add-for-user")]
        public async Task<IActionResult> AddAddressForUser([FromBody] StaffAddressForUserRequest request) {
            try {
                if (request.UserID == Guid.Empty)
                    return BadRequest("UserID is required.");
                var address = new Address {
                    StreetAddress = request.StreetAddress,
                    District = request.District,
                    Province = request.Province
                };
                await _addressService.AddUserAddress(address, request.UserID);
                return Ok(new { addressID = address.AddressID });
            } catch (Exception e) {
                return StatusCode(500, $"Error in addressController.AddAddressForUser: {e.Message}");
            }
        }

        [HttpPut("set-default/{addressID}")]
        public async Task<IActionResult> SetDefault(Guid addressID) {
            var userID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");
            if (address.UserID != userID) return Forbid();

            await _addressService.SetDefault(addressID, userID);
            return Ok("Đặt địa chỉ mặc định thành công");
        }

        [HttpDelete("delete/{addressID}")]
        public async Task<IActionResult> DeleteAddress(Guid addressID) {
            var userID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");
            if (address.UserID != userID) return Forbid();

            var deleted = await _addressService.DeleteUserAddress(addressID, userID);
            if (!deleted) return BadRequest("Không thể xóa địa chỉ duy nhất.");
            return Ok("Xóa địa chỉ thành công");
        }
    }
}
