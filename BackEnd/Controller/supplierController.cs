using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController] //gọi api của controller
    [Route("api/pbl3/[controller]")]

    public class supplierController : ControllerBase
    {
        private readonly ISupplierService _supplierService;
        
        public supplierController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllSuppliers()
        {
            try
            {
                var suppliers = await _supplierService.GetAllSuppliers();
                return Ok(suppliers); // day du 
            } catch (Exception ex)
            {
                return StatusCode(500, $"An error ocurred in supplierController.GetAllSuppliers: {ex.Message}");
            }
        }

        [HttpGet("get/{supplierID}")]
        public async Task<IActionResult> GetSupplierByID(int supplierID)
        {
            try
            {
                var supplier = await _supplierService.GetSupplierByID(supplierID);
                if(supplier == null)
                    return NotFound("Supplier not found");

                return Ok(supplier);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in supplierController.GetSupplierByID: {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddSupplier([FromBody] SupplierCreateRequest createRequest)
        {
            try
            {
                await _supplierService.AddSupplier(createRequest);
                return Ok("Supplier created supplier successfully");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in supplierController.AddSupplier: {ex.Message}");
            }
        }

        [HttpPut("update/{supplierID}")]
        public async Task<IActionResult> UpdateSupplier(int supplierID, SupplierUpdateRequest request)
        {
            try
            {
                await _supplierService.UpdateSupplier(supplierID, request);
                return Ok("Supplier updated successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in supplierController.UpdateSupplier: {ex.Message}");
            }
        }

        [HttpDelete("soft-delete/{supplierID}")]
        public async Task<IActionResult> SoftDeleteSupplier(int supplierID)
        {
            try
            {
                await _supplierService.SoftDeleteSupplier(supplierID);
                return Ok("Supplier soft delete sucessfully!");
            } catch(Exception ex)
            {
                return StatusCode(500, $"An error ocurred in supplierController.DeleteSupplier: {ex.Message}");
            }
        }
    }
}