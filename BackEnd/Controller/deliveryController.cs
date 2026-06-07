using Backend.Helpers;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class DeliveryController : ControllerBase {
        private readonly IDeliveryInfoService _deliveryService;

        public DeliveryController(IDeliveryInfoService deliveryService) {
            _deliveryService = deliveryService;
        }

        [Authorize(Roles = "Manager,Counter,Dining,Kitchen")]
        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllDeliveryIn(DateTime start, DateTime end, [FromQuery] int? storeID = null) {
            // Nhân viên chỉ thấy đơn giao của store mình (đơn ⇒ bill ⇒ store).
            return Ok(await _deliveryService.GetAllDeliveryIn(start, end, User.GetStoreID() ?? storeID));
        }

        [HttpGet("get-by-user/{userID}")]
        public async Task<IActionResult> GetAllDeliveryByUser(Guid userID) {
            return Ok(await _deliveryService.GetAllDeliveryByUser(userID));
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddDeliveryInfo(DeliveryInfoCreateRequest request) {
            await _deliveryService.AddDeliveryInfo(request);
            return Ok("Add delivery info successfully!");
        }

        [HttpPut("update/{deliveryID}")]
        public async Task<IActionResult> UpdateDelivery(Guid deliveryID, DeliveryUpdateRequest request) {
            await _deliveryService.UpdateDelivery(deliveryID, request);
            return Ok("Update delivery successfully!");
        }

        [HttpDelete("soft-delete/{deliveryID}")]
        public async Task<IActionResult> SoftDeleteDeliveryInfo(Guid deliveryID) {
            await _deliveryService.SoftDeleteDeliveryInfo(deliveryID);
            return Ok("Soft delete delivery successfully!");
        }
    }
}
