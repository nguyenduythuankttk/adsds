using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class shiftController : ControllerBase {
        private readonly IShiftService _shiftService;
        private readonly IShiftTaskService _taskService;

        public shiftController(IShiftService shiftService, IShiftTaskService taskService) {
            _shiftService = shiftService;
            _taskService = taskService;
        }

        // ── SHIFT ─────────────────────────────────────────────────────────

        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpGet("my-shifts")]
        public async Task<IActionResult> GetMyShifts([FromQuery] DateOnly start, [FromQuery] DateOnly end) {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                var shifts = await _shiftService.GetShiftsByEmployee(empID.Value, start, end);
                return Ok(shifts ?? []);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpGet("get-all/{date}")]
        public async Task<IActionResult> GetAllShifts(DateOnly date) {
            try {
                var shifts = await _shiftService.GetAllShiftIn(date);
                return Ok(shifts ?? []);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpGet("my-shift")]
        public async Task<IActionResult> GetMyShift() {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                var today = DateOnly.FromDateTime(DateTime.Now);
                var shifts = await _shiftService.GetAllShiftIn(today);
                var mine = shifts?.FirstOrDefault(s => s.EmployeeID == empID.Value);
                if (mine == null) return Ok(null);
                return Ok(mine);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // Manager phân ca cho nhân viên trong store của mình. storeID lấy từ URL
        // (FE truyền ADMIN_STORE_ID); service kiểm tra EmployeeID có thuộc store này.
        [Authorize(Roles = "Manager")]
        [HttpPost("assign/{storeID}")]
        public async Task<IActionResult> AssignShift(int storeID, [FromBody] ShiftAssignRequest request) {
            try {
                var shift = await _shiftService.AssignShift(storeID, request);
                return Ok(new { message = "Phân ca thành công", data = shift });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("delete/{shiftID}")]
        public async Task<IActionResult> DeleteShift(Guid shiftID) {
            try {
                await _shiftService.SoftDeleteShift(shiftID);
                return Ok(new { message = "Đã xóa ca" });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // ── SHIFT TASK ─────────────────────────────────────────────────────

        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpGet("task/by-shift/{shiftID}")]
        public async Task<IActionResult> GetTasksByShift(Guid shiftID) {
            try {
                var tasks = await _taskService.GetTasksByShiftID(shiftID);
                return Ok(tasks);
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpPost("task/add")]
        public async Task<IActionResult> AddTask([FromBody] ShiftTaskCreateRequest request) {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                var task = await _taskService.AddTask(request, empID.Value);
                return Ok(new { message = "Tạo nhiệm vụ thành công", data = task.TaskID });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager,Dining,Kitchen,Counter")]
        [HttpPatch("task/{taskID}/complete")]
        public async Task<IActionResult> CompleteTask(Guid taskID) {
            try {
                var empID = GetCallerID();
                if (empID == null) return Unauthorized();
                await _taskService.CompleteTask(taskID, empID.Value);
                return Ok(new { message = "Đã đánh dấu hoàn thành" });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("task/{taskID}")]
        public async Task<IActionResult> DeleteTask(Guid taskID) {
            try {
                await _taskService.DeleteTask(taskID);
                return Ok(new { message = "Đã xóa nhiệm vụ" });
            } catch (Exception e) {
                return StatusCode(500, new { message = e.Message });
            }
        }

        // ─────────────────────────────────────────────────────────────────
        private Guid? GetCallerID() {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("user_id")?.Value;
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
