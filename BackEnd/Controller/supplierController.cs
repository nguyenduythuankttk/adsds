using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
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
            return Ok(await _supplierService.GetAllSuppliers());
        }

        [HttpGet("get/{supplierID}")]
        public async Task<IActionResult> GetSupplierByID(int supplierID)
        {
            var supplier = await _supplierService.GetSupplierByID(supplierID);
            if (supplier == null) return NotFound("Supplier not found");
            return Ok(supplier);
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddSupplier([FromBody] SupplierCreateRequest createRequest)
        {
            await _supplierService.AddSupplier(createRequest);
            return Ok("Supplier created successfully");
        }

        [HttpPut("update/{supplierID}")]
        public async Task<IActionResult> UpdateSupplier(int supplierID, SupplierUpdateRequest request)
        {
            await _supplierService.UpdateSupplier(supplierID, request);
            return Ok("Supplier updated successfully!");
        }

        [HttpDelete("soft-delete/{supplierID}")]
        public async Task<IActionResult> SoftDeleteSupplier(int supplierID)
        {
            await _supplierService.SoftDeleteSupplier(supplierID);
            return Ok("Supplier soft delete successfully!");
        }
    }
}
