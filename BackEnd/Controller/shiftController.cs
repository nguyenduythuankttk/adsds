using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class shiftController : ControllerBase
    {
        private readonly IShiftService _shiftService;

        public shiftController(IShiftService shiftService)
        {
            _shiftService = shiftService;
        }

        [HttpGet("by-date/{date}")]
        public async Task<IActionResult> GetByDate(DateOnly date)
        {
            return Ok(await _shiftService.GetAllShiftIn(date));
        }

        [HttpGet("get/{shiftID}")]
        public async Task<IActionResult> GetByID(Guid shiftID)
        {
            var s = await _shiftService.GetShiftByID(shiftID);
            if (s == null) return NotFound("Không tìm thấy ca");
            return Ok(s);
        }

        [HttpGet("by-store/{storeID}/{start}/{end}")]
        public async Task<IActionResult> GetByStore(int storeID, DateOnly start, DateOnly end)
        {
            return Ok(await _shiftService.GetShiftsByStore(storeID, start, end));
        }

        [HttpGet("by-employee/{employeeID}/{start}/{end}")]
        public async Task<IActionResult> GetByEmployee(Guid employeeID, DateOnly start, DateOnly end)
        {
            return Ok(await _shiftService.GetShiftsByEmployee(employeeID, start, end));
        }

        // Admin phân ca cho nhân viên trong cửa hàng của mình. storeID nằm trên URL
        // để chặn ngay trường hợp gán nhầm nhân viên của cửa hàng khác.
        [Authorize(Roles = "Manager")]
        [HttpPost("assign/{storeID}")]
        public async Task<IActionResult> Assign(int storeID, [FromBody] ShiftAssignRequest request)
        {
            try
            {
                var res = await _shiftService.AssignShift(storeID, request);
                return Ok(res);
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpPut("update/{shiftID}")]
        public async Task<IActionResult> Update(Guid shiftID, [FromBody] ShiftUpdateRequest request)
        {
            try
            {
                await _shiftService.UpdateShift(request, shiftID);
                return Ok("Cập nhật ca thành công");
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("delete/{shiftID}")]
        public async Task<IActionResult> Delete(Guid shiftID)
        {
            try
            {
                await _shiftService.SoftDeleteShift(shiftID);
                return Ok("Xóa ca thành công");
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        // Cho nhân viên tự bấm check-in / check-out từ giao diện employee.
        [Authorize]
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(idStr)) return Unauthorized();
            return Ok(await _shiftService.CheckInForEmployee(Guid.Parse(idStr)));
        }

        [Authorize]
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(idStr)) return Unauthorized();
            return Ok(await _shiftService.CheckOutForEmployee(Guid.Parse(idStr)));
        }
    }
}
