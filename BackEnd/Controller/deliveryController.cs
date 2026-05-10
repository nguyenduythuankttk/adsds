using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
namespace Backend.Controller{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class DeliveryController : ControllerBase{
        private readonly IDeliveryInfoService _deliveryService;
        public DeliveryController(IDeliveryInfoService deliveryService){
            _deliveryService = deliveryService;
        }
        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllDeliveryIn(DateTime start, DateTime end){
            try{
                var deliveries = await _deliveryService.GetAllDeliveryIn(start, end);
                return Ok(deliveries);
            } catch(Exception ex){
                return StatusCode(500, $"An error occurred in DeliveryController.GetAllDeliveryIn {ex.Message}");
            }
        }
        [HttpGet("get-by-user/{userID}")]
        public async Task<IActionResult> GetAllDeliveryByUser(Guid userID){
            try{
                var deliveries = await _deliveryService.GetAllDeliveryByUser(userID);
                return Ok(deliveries);
            } catch(Exception ex){
                return StatusCode(500, $"An error occurred in DeliveryController.GetAllDeliveryByUser {ex.Message}");
            }
        }
        [HttpPost("create")]
        public async Task<IActionResult> AddDeliveryInfo(DeliveryInfoCreateRequest request){
            try{
                await _deliveryService.AddDeliveryInfo(request);
                return Ok("Add delivery info successfully!");
            } catch(Exception ex){
                return StatusCode(500, $"An error occurred in DeliveryController.AddDeliveryInfo {ex.Message}");
            }
        }
        [HttpPut("update/{deliveryID}")]
        public async Task<IActionResult> UpdateDelivery(Guid deliveryID, DeliveryUpdateRequest request){
            try{
                await _deliveryService.UpdateDelivery(deliveryID, request);
                return Ok("Update delivery successfully!");
            } catch(Exception ex){
                return StatusCode(500, $"An error occurred in DeliveryController.UpdateDelivery {ex.Message}");
            }
        }
        [HttpDelete("soft-delete/{deliveryID}")]
        public async Task<IActionResult> SoftDeleteDeliveryInfo(Guid deliveryID){
            try{
                await _deliveryService.SoftDeleteDeliveryInfo(deliveryID);
                return Ok("Soft delete delivery successfully!");
            } catch(Exception ex){
                return StatusCode(500, $"An error occurred in DeliveryController.SoftDeleteDeliveryInfo {ex.Message}");
            }
        }
    }
}