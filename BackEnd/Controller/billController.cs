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
        [HttpGet("get-by-user/{userID}")]
        public async Task<IActionResult> GetUserBill() {
            try {
                var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value?? User.FindFirst("user_id")?.Value;
                var bills = await _billService.GetUserBill(Guid.Parse(userID));
                if (bills == null || bills.Count == 0) return NotFound("Không có hóa đơn nào của người dùng này");
                return Ok(bills);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetUserBill: {e.Message}");
            }
        }

        
        [HttpGet("get/{billID}")]
        public async Task<IActionResult> GetBillByID(Guid billID) {
            try {

                var bill = await _billService.GetBillByID(billID);
                if (bill == null) return NotFound("Không tìm thấy hóa đơn");
                return Ok(bill);
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.GetBillByID: {e.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddBill([FromBody] BillCreateRequest request) {
            try {
                await _billService.AddBill(request);
                return Ok("Tạo hóa đơn thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.AddBill: {e.Message}");
            }
        }

        [HttpPost("change")]
        public async Task<IActionResult> ChangeBill([FromBody] BillChangeRequest request) {
            try {
                await _billService.ChangeBill(request);
                return Ok("Cập nhật trạng thái hóa đơn thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in billController.ChangeBill: {e.Message}");
            }
        }

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
