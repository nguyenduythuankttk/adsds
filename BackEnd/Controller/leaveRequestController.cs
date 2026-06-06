using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class leaveRequestController : ControllerBase {
        private readonly ILeaveRequestService _leaveService;

        public leaveRequestController(ILeaveRequestService leaveService) {
            _leaveService = leaveService;
        }

        // Nhân viên xem đơn xin nghỉ của mình
        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests() {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                var list = await _leaveService.GetMyLeaveRequests(empID.Value);
                return Ok(list);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // Manager xem tất cả đơn trong store
        [Authorize(Roles = "Manager")]
        [HttpGet("by-store/{storeID}")]
        public async Task<IActionResult> GetByStore(int storeID) {
            try {
                var list = await _leaveService.GetLeaveRequestsByStore(storeID);
                return Ok(list);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // Nhân viên tạo đơn xin nghỉ
        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LeaveRequestCreateRequest request) {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                var result = await _leaveService.CreateLeaveRequest(empID.Value, request);
                return Ok(new { message = "Tạo đơn xin nghỉ thành công", data = result });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // Manager duyệt hoặc từ chối đơn
        [Authorize(Roles = "Manager")]
        [HttpPatch("{leaveRequestID}/review")]
        public async Task<IActionResult> Review(Guid leaveRequestID, [FromBody] LeaveRequestReviewRequest request) {
            try {
                var managerID = GetCallerID();
                if (managerID == null) return Unauthorized();
                var result = await _leaveService.ReviewLeaveRequest(leaveRequestID, managerID.Value, request);
                return Ok(new { message = "Đã xử lý đơn xin nghỉ", data = result });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // Nhân viên huỷ đơn (chỉ khi còn Pending)
        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpDelete("{leaveRequestID}/cancel")]
        public async Task<IActionResult> Cancel(Guid leaveRequestID) {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                await _leaveService.CancelLeaveRequest(leaveRequestID, empID.Value);
                return Ok(new { message = "Đã huỷ đơn xin nghỉ" });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        private Guid? GetCallerID() {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("user_id")?.Value;
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
