using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class InventoryBatchController : ControllerBase
    {
        private readonly IInventoryBatchService _batchService;

        public InventoryBatchController(IInventoryBatchService batchService)
        {
            _batchService = batchService;
        }

        [HttpGet("get/{batchID}")]
        public async Task<IActionResult> GetByID(Guid batchID)
        {
            try
            {
                var batch = await _batchService.GetBatchByID(batchID);
                if (batch == null) return NotFound("Batch not found.");
                return Ok(batch);
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error in InventoryBatchController.GetByID: {e.Message}");
            }
        }

        [HttpGet("by-warehouse/{warehouseID}")]
        public async Task<IActionResult> GetByWarehouse(int warehouseID)
        {
            try
            {
                var batches = await _batchService.GetBatchesByWarehouse(warehouseID);
                return Ok(batches);
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error in InventoryBatchController.GetByWarehouse: {e.Message}");
            }
        }

        [HttpGet("by-ingredient/{ingredientID}")]
        public async Task<IActionResult> GetByIngredient(int ingredientID)
        {
            try
            {
                var batches = await _batchService.GetBatchesByIngredient(ingredientID);
                return Ok(batches);
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error in InventoryBatchController.GetByIngredient: {e.Message}");
            }
        }

        // Dùng cho màn hình tạo phiếu sơ chế — chọn batch thô còn hàng
        [HttpGet("available-raw")]
        public async Task<IActionResult> GetAvailableRaw([FromQuery] int? ingredientID)
        {
            try
            {
                var batches = await _batchService.GetAvailableRawBatches(ingredientID);
                return Ok(batches);
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error in InventoryBatchController.GetAvailableRaw: {e.Message}");
            }
        }

        // Dùng cho FIFO khi tạo Bill — chỉ batch đã sơ chế còn hàng
        [HttpGet("available-processed")]
        public async Task<IActionResult> GetAvailableProcessed([FromQuery] int? ingredientID)
        {
            try
            {
                var batches = await _batchService.GetAvailableProcessedBatches(ingredientID);
                return Ok(batches);
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error in InventoryBatchController.GetAvailableProcessed: {e.Message}");
            }
        }
    }
}
