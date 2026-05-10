using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class DeliveryController : ControllerBase {
        private readonly IDeliveryInfoService _deliveryService;

        public DeliveryController(IDeliveryInfoService deliveryService) {
            _deliveryService = deliveryService;
        }

        [Authorize(Roles = "Manager,Counter")]
        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllDeliveryIn(DateTime start, DateTime end) {
            try {
                var deliveries = await _deliveryService.GetAllDeliveryIn(start, end);
                if (deliveries == null || deliveries.Count == 0) return NotFound("Không có đơn giao hàng nào");
                return Ok(deliveries);
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.GetAllDeliveryIn: {e.Message}");
            }
        }

        
        [Authorize]
        [HttpGet("my-deliveries")]
        public async Task<IActionResult> GetMyDeliveries() {
            try {
                var callerID = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var deliveries = await _deliveryService.GetAllDeliveryByUser(callerID);
                if (deliveries == null || deliveries.Count == 0) return NotFound("Không có đơn giao hàng nào");
                return Ok(deliveries);
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.GetMyDeliveries: {e.Message}");
            }
        }


        [Authorize(Roles = "Manager,Counter")]
        [HttpGet("get-by-user/{userID}")]
        public async Task<IActionResult> GetDeliveryByUser(Guid userID) {
            try {
                var deliveries = await _deliveryService.GetAllDeliveryByUser(userID);
                if (deliveries == null || deliveries.Count == 0) return NotFound("Không có đơn giao hàng nào");
                return Ok(deliveries);
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.GetDeliveryByUser: {e.Message}");
            }
        }


        [Authorize(Roles = "Manager,Counter")]
        [HttpPost("add")]
        public async Task<IActionResult> AddDeliveryInfo([FromBody] DeliveryInfoCreateRequest request) {
            try {
                await _deliveryService.AddDeliveryInfo(request);
                return Ok("Thêm thông tin giao hàng thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.AddDeliveryInfo: {e.Message}");
            }
        }

        [Authorize(Roles = "Manager,Counter")]
        [HttpPut("update/{deliveryID}")]
        public async Task<IActionResult> UpdateDelivery(Guid deliveryID, [FromBody] DeliveryUpdateRequest request) {
            try {
                await _deliveryService.UpdateDelivery(deliveryID, request);
                return Ok("Cập nhật trạng thái giao hàng thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.UpdateDelivery: {e.Message}");
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpDelete("delete/{deliveryID}")]
        public async Task<IActionResult> SoftDelete(Guid deliveryID) {
            try {
                await _deliveryService.SoftDeleteDeliveryInfo(deliveryID);
                return Ok("Xóa thông tin giao hàng thành công");
            } catch (Exception e) {
                return StatusCode(500, $"Error in DeliveryController.SoftDelete: {e.Message}");
            }
        }
    }
}
