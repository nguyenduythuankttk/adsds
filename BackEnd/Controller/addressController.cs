using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
            var addresses = await _addressService.GetUserAddress(new User { UserID = ClaimsHelper.GetUserId(User) });
            return Ok(addresses);
        }

        [HttpGet("get/{addressID}")]
        public async Task<IActionResult> GetAddressByID(Guid addressID) {
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");

            if (!ClaimsHelper.IsEmployee(User) && address.UserID != ClaimsHelper.GetUserId(User))
                return Forbid();

            return Ok(address);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddAddress([FromBody] AddressCreateRequest request) {
            var address = new Address {
                HouseNumber = request.HouseNumber,
                Street = request.Street,
                Ward = request.Ward,
                District = request.District,
                Province = request.Province,
                Country = request.Country
            };
            await _addressService.AddUserAddress(address, ClaimsHelper.GetUserId(User));
            return Ok("Thêm địa chỉ thành công");
        }

        [HttpPut("set-default/{addressID}")]
        public async Task<IActionResult> SetDefault(Guid addressID) {
            var userID = ClaimsHelper.GetUserId(User);
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");
            if (address.UserID != userID) return Forbid();

            await _addressService.SetDefault(addressID, userID);
            return Ok("Đặt địa chỉ mặc định thành công");
        }

        [HttpDelete("delete/{addressID}")]
        public async Task<IActionResult> DeleteAddress(Guid addressID) {
            var userID = ClaimsHelper.GetUserId(User);
            var address = await _addressService.GetAddressByID(addressID);
            if (address == null) return NotFound("Không tìm thấy địa chỉ");
            if (address.UserID != userID) return Forbid();

            var deleted = await _addressService.DeleteUserAddress(addressID, userID);
            if (!deleted) return BadRequest("Không thể xóa địa chỉ duy nhất.");
            return Ok("Xóa địa chỉ thành công");
        }
    }
}
