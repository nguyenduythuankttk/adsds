using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
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
        public async Task<IActionResult> GetAllPOIn(DateOnly start, DateOnly end)
        {
            try
            {
                var pos = await _purchaseOrderService.GetAllPOIn(start, end);
                return Ok(pos);
            }catch(Exception Ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOrderController.GetAllPOIn {Ex.Message}");
            }
        }

        [HttpGet("get/{id}")]
        public async Task<IActionResult> GetPOByID(Guid id)
        {
            try
            {
                var po = await _purchaseOrderService.GetPOByID(id);
                if(po == null)
                    return NotFound("Purchase Order not found!");

                return Ok(po);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOrderController.GetPOByID {ex.Message}");
            }
        }

        [HttpGet("get-by-store/{storeID}")]
        public async Task<IActionResult> GetAllPOByStore(int storeID)
        {
            try
            {
                var postores = await _purchaseOrderService.GetAllPOByStore(storeID);
                return Ok(postores);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOderController.GetPOByStore {ex.Message}");
            }
        }

        [HttpGet("get-by-supplier/{supplierID}")]
        public async Task<IActionResult> GetAllPOBySupplier(int supplierID)
        {
            try
            {
                var posuppliers = await _purchaseOrderService.GetAllPOBySupplier(supplierID);
                return Ok(posuppliers);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOderController.GetPOBySupplier {ex.Message}");
            }
        }

        [HttpGet("get-by-status/{statusID}")]
        public async Task<IActionResult> GetPOByStatus(PO_Status statusID)
        {
            try
            {
                var postatuses = await _purchaseOrderService.GetPOByStatus(statusID);
                return Ok(postatuses);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOderController.GetPOByStatus {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePO(POCreateRequest createRequest)
        {
            try
            {
                await _purchaseOrderService.CreatePO(createRequest);
                return Ok("Add purchase order successfully!");
            }catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOrderController.CreatePO {ex.Message}");
            }
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdatePO(Guid id, POUpdateRequest updateRequest)
        {
            try
            {
                await _purchaseOrderService.UpdatePO(id, updateRequest);
                return Ok("Update purchase order successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in purchaseOrderController.UpdatePO {ex.Message}");
            }
        }

        
    }
}