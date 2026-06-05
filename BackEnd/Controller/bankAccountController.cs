using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class bankAccountController : ControllerBase
    {
        private readonly IBankAccountService _service;

        public bankAccountController(IBankAccountService service)
        {
            _service = service;
        }

        [Authorize(Roles = "Manager")]
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAll());
        }

        [HttpGet("by-store/{storeID}")]
        public async Task<IActionResult> GetByStore(int storeID)
        {
            var acc = await _service.GetByStore(storeID);
            if (acc == null) return NotFound(new { message = "Cửa hàng chưa có tài khoản ngân hàng." });
            return Ok(acc);
        }

        // Admin/Manager đặt hoặc cập nhật TK ngân hàng nhận tiền của cửa hàng.
        [Authorize(Roles = "Manager")]
        [HttpPut("by-store/{storeID}")]
        public async Task<IActionResult> Upsert(int storeID, [FromBody] BankAccountUpsertRequest request)
        {
            try
            {
                return Ok(await _service.UpsertForStore(storeID, request));
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("by-store/{storeID}")]
        public async Task<IActionResult> Delete(int storeID)
        {
            try
            {
                await _service.DeleteForStore(storeID);
                return Ok(new { message = "Đã xóa tài khoản ngân hàng." });
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }
    }
}
