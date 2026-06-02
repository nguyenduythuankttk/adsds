using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> GetAllBillIn(DateOnly start, DateOnly end, [FromQuery] int? storeID = null) {
            try {
                var bills = await _billService.GetAllBillIn(start, end, storeID);
                if (bills == null || bills.Count == 0) return Ok(new List<Bill>());
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
                return Ok(bills ?? new List<Backend.Models.DTOs.Reponse.BillReponse>());
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetMyBills: {e.Message}");
            }
        }

        [Authorize]
        [HttpGet("get/{billID}")]
        public async Task<IActionResult> GetBillByID(Guid billID) {
            var bill = await _billService.GetBillByID(billID);
            if (bill == null) return NotFound("Không tìm thấy hóa đơn");

            var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            bool isEmployee = role != "Customer";

            if (!isEmployee && bill.UserID != callerID)
                return Forbid();

            return Ok(bill);
        }

        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("create-dinein")]
        public async Task<IActionResult> CreateDineInBill([FromBody] DineInBillCreateRequest request) {
            try {
                var result = await _billService.CreateDineInBill(request);
                return Ok(result);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.CreateDineInBill: {e.Message}");
            }
        }

        [Authorize]
        [HttpPost("create-delivery")]
        public async Task<IActionResult> CreateDeliveryBill([FromBody] DeliveryBillCreateRequest request) {
            var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            bool isEmployee = role != "Customer";

            if (!isEmployee)
                request.UserID = callerID;

            try {
                var result = await _billService.CreateDeliveryBill(request);
                return Ok(result);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.CreateDeliveryBill: {e.Message}");
            }
        }

        [Authorize]
        [HttpGet("payment-status/{billID}")]
        public async Task<IActionResult> GetPaymentStatus(Guid billID) {
            try {
                var status = await _billService.GetPaymentStatus(billID);
                if (status == null) return NotFound("Không tìm thấy hóa đơn");
                return Ok(status);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetPaymentStatus: {e.Message}");
            }
        }

        [Authorize]
        [HttpPost("cancel/{billID}")]
        public async Task<IActionResult> CancelUnpaidBill(Guid billID) {
            try {
                var callerID = Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value)!);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isStaff = role == "Manager" || role == "Counter";
                await _billService.CancelUnpaidBill(billID, callerID, isStaff);
                return Ok(new { success = true });
            } catch (Exception e) {
                return StatusCode(500, new { success = false, message = e.Message });
            }
        }

        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("change-status")]
        public async Task<IActionResult> ChangeBill([FromBody] BillChangeRequest request) {
            await _billService.ChangeBill(request);
            return Ok("Cập nhật trạng thái hóa đơn thành công");
        }
    }
}
