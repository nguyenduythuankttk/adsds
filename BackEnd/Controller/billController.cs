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
        public async Task<IActionResult> GetAllBillIn(DateOnly start, DateOnly end) {
            var bills = await _billService.GetAllBillIn(start, end);
            if (bills == null || bills.Count == 0) return NotFound("Không có hóa đơn nào");
            return Ok(bills);
        }

        [Authorize]
        [HttpGet("my-bills")]
        public async Task<IActionResult> GetMyBills() {
            var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (string.IsNullOrWhiteSpace(userID)) return Unauthorized();
            var bills = await _billService.GetUserBill(Guid.Parse(userID));
            return Ok(bills ?? new List<Bill>());
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
            await _billService.CreateDineInBill(request);
            return Ok("Tạo hóa đơn tại chỗ thành công");
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

            await _billService.CreateDeliveryBill(request);
            return Ok("Tạo hóa đơn giao hàng thành công");
        }

        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("change-status")]
        public async Task<IActionResult> ChangeBill([FromBody] BillChangeRequest request) {
            await _billService.ChangeBill(request);
            return Ok("Cập nhật trạng thái hóa đơn thành công");
        }
    }
}
