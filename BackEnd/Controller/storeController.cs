using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class storeController : ControllerBase
    {
        private readonly IStoreService _storeService;

        public storeController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        [HttpGet("shipping-fee/{addressID}")]
        public async Task<IActionResult> GetShippingFee(Guid addressID, [FromQuery] int? storeID = null)
        {
            try
            {
                var result = await _storeService.GetShippingFee(addressID, storeID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllStore()
        {
            // Nhân viên (admin/employee) chỉ thấy store của mình; khách (trang tìm cửa hàng)
            // và request ẩn danh vẫn thấy toàn bộ chuỗi. "Thêm chi nhánh" dùng endpoint riêng nên không bị ảnh hưởng.
            var sid = User.GetStoreID();
            if (sid.HasValue)
            {
                var mine = await _storeService.GetStoreByID(sid.Value);
                return Ok(mine == null ? new List<StoreResponse>() : new List<StoreResponse> { mine });
            }
            return Ok(await _storeService.GetAllStore());
        }

        [HttpGet("get/{storeID}")]
        public async Task<IActionResult> GetStoreByID(int storeID)
        {
            var store = await _storeService.GetStoreByID(storeID);
            if (store == null) return NotFound("Store not found!");
            return Ok(store);
        }

        [HttpGet("get-byaddress/{addressID}")]
        public async Task<IActionResult> GetStoreByAddress(Guid addressID)
        {
            var store = await _storeService.GetStoreByAdress(addressID);
            if (store == null) return NotFound("Store not found!");
            return Ok(store);
        }

        [HttpPost("add/{store}")]
        public async Task<IActionResult> AddStore(Store store)
        {
            await _storeService.AddStore(store);
            return Ok("Add store successfully!");
        }

        // Thêm chi nhánh đầy đủ: store + địa chỉ + TK ngân hàng + tài khoản quản lý.
        // Chỉ Manager mới được tạo chi nhánh mới.
        [Authorize(Roles = "Manager")]
        [HttpPost("add-full")]
        public async Task<IActionResult> AddStoreFull([FromBody] StoreCreateRequest request)
        {
            try
            {
                var storeID = await _storeService.CreateStoreFull(request);
                return Ok(new { storeID, message = "Thêm chi nhánh thành công!" });
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        [HttpPut("update/{storeID}")]
        public async Task<IActionResult> UpdateStore(int storeID, StoreUpdateRequest request)
        {
            await _storeService.UpdateStore(storeID, request);
            return Ok("Update store successfully!");
        }

        [HttpDelete("softdelete/{storeID}")]
        public async Task<IActionResult> SoftDeleteStore(int storeID)
        {
            await _storeService.SoftDeleteStore(storeID);
            return Ok("Soft delete store successfully!");
        }
    }
}
