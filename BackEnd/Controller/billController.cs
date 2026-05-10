using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class billController : ControllerBase {
        private readonly IBillService _billService;

        public billController(IBillService billService) {
            _billService = billService;
        }
        [Authorize(Roles = "Manager,Counter")]
        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllBillIn(DateOnly start, DateOnly end) {
            try {
                var bills = await _billService.GetAllBillIn(start, end);
                if (bills == null || bills.Count == 0) return NotFound("Không có hóa đơn nào");
                return Ok(bills);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetAllBillIn: {e.Message}");
            }
        }

    
        [Authorize]
        [HttpGet("my-bills")]
        public async Task<IActionResult> GetMyBills() {
            try {
                var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value;
                if (string.IsNullOrWhiteSpace(userID)) return Unauthorized();
                var bills = await _billService.GetUserBill(Guid.Parse(userID));
                if (bills == null || bills.Count == 0) return NotFound("Không có hóa đơn nào");
                return Ok(bills);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetMyBills: {e.Message}");
            }
        }

        // Chủ sở hữu hoặc nhân viên xem bill cụ thể
        [Authorize]
        [HttpGet("get/{billID}")]
        public async Task<IActionResult> GetBillByID(Guid billID) {
            try {
                var bill = await _billService.GetBillByID(billID);
                if (bill == null) return NotFound("Không tìm thấy hóa đơn");

                var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value)!);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isEmployee = role != "Customer";

                if (!isEmployee && bill.UserID != callerID)
                    return Forbid();

                return Ok(bill);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetBillByID: {e.Message}");
            }
        }

        // Nhân viên tạo bill dine-in
        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("create-dinein")]
        public async Task<IActionResult> CreateDineInBill([FromBody] DineInBillCreateRequest request) {
            try {
                await _billService.CreateDineInBill(request);
                return Ok("Tạo hóa đơn tại chỗ thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.CreateDineInBill: {e.Message}");
            }
        }


        [Authorize]
        [HttpPost("create-delivery")]
        public async Task<IActionResult> CreateDeliveryBill([FromBody] DeliveryBillCreateRequest request) {
            try {
                var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value)!);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isEmployee = role != "Customer";

                if (!isEmployee)
                    request.UserID = callerID;

                await _billService.CreateDeliveryBill(request);
                return Ok("Tạo hóa đơn giao hàng thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.CreateDeliveryBill: {e.Message}");
            }
        }

        // Nhân viên thay đổi trạng thái bill
        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("change-status")]
        public async Task<IActionResult> ChangeBill([FromBody] BillChangeRequest request) {
            try {
                await _billService.ChangeBill(request);
                return Ok("Cập nhật trạng thái hóa đơn thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.ChangeBill: {e.Message}");
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("delete/{billID}")]
        public async Task<IActionResult> SoftDelete(Guid billID) {
            try {
                await _billService.SoftDeleteBill(billID);
                return Ok("Xóa hóa đơn thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.SoftDelete: {e.Message}");
            }
        }
    }
}
