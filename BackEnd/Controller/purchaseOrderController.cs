using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class purchaseOrderController : ControllerBase
    {
        private readonly IPurchaseOrderService _purchaseOrderService;

        public purchaseOrderController(IPurchaseOrderService purchaseOrderService)
        {
            _purchaseOrderService = purchaseOrderService;
        }

        [HttpGet("Get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllPOIn(DateOnly start, DateOnly end, [FromQuery] int? storeID = null)
        {
            // Nhân viên chỉ thấy đơn mua của store mình.
            storeID = User.GetStoreID() ?? storeID;
            return Ok(await _purchaseOrderService.GetAllPOIn(start, end, storeID));
        }

        [HttpGet("get/{id}")]
        public async Task<IActionResult> GetPOByID(Guid id)
        {
            var po = await _purchaseOrderService.GetPOByID(id);
            if (po == null) return NotFound("Purchase Order not found!");
            return Ok(po);
        }

        [HttpGet("get-by-store/{storeID}")]
        public async Task<IActionResult> GetAllPOByStore(int storeID)
        {
            storeID = User.GetStoreID() ?? storeID;
            return Ok(await _purchaseOrderService.GetAllPOByStore(storeID));
        }

        [HttpGet("get-by-supplier/{supplierID}")]
        public async Task<IActionResult> GetAllPOBySupplier(int supplierID)
        {
            return Ok(await _purchaseOrderService.GetAllPOBySupplier(supplierID));
        }

        [HttpGet("get-by-status/{statusID}")]
        public async Task<IActionResult> GetPOByStatus(PO_Status statusID)
        {
            return Ok(await _purchaseOrderService.GetPOByStatus(statusID));
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePO(POCreateRequest createRequest)
        {
            createRequest.StoreID = User.GetStoreID() ?? createRequest.StoreID;
            var result = await _purchaseOrderService.CreatePO(createRequest);
            return CreatedAtAction(nameof(GetPOByID), new { id = result.POID }, result);
        }

        [Authorize(Roles = "Manager")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdatePO(Guid id, POUpdateRequest updateRequest)
        {
            await _purchaseOrderService.UpdatePO(id, updateRequest);
            return Ok("Update purchase order successfully!");
        }

        [HttpDelete("soft-delete/{id}")]
        public async Task<IActionResult> SoftDeletePO(Guid id)
        {
            await _purchaseOrderService.SoftDeletePO(id);
            return Ok("Soft delete purchase order successfully!");
        }
    }
}
