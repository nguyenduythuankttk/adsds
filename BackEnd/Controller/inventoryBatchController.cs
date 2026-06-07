using Backend.Helpers;
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
            var batch = await _batchService.GetBatchByID(batchID);
            if (batch == null) return NotFound("Batch not found.");
            return Ok(batch);
        }

        [HttpGet("by-warehouse/{warehouseID}")]
        public async Task<IActionResult> GetByWarehouse(int warehouseID)
        {
            return Ok(await _batchService.GetBatchesByWarehouse(warehouseID));
        }

        [HttpGet("by-ingredient/{ingredientID}")]
        public async Task<IActionResult> GetByIngredient(int ingredientID)
        {
            return Ok(await _batchService.GetBatchesByIngredient(ingredientID));
        }

        // Dùng cho màn hình tạo phiếu sơ chế — chọn batch thô còn hàng
        [HttpGet("available-raw")]
        public async Task<IActionResult> GetAvailableRaw([FromQuery] int? ingredientID, [FromQuery] int? storeID = null)
        {
            // Nhân viên chỉ thấy lô thô của store mình (dùng cho màn sơ chế + dashboard admin).
            return Ok(await _batchService.GetAvailableRawBatches(ingredientID, User.GetStoreID() ?? storeID));
        }

        // Dùng cho FIFO khi tạo Bill — chỉ batch đã sơ chế còn hàng
        [HttpGet("available-processed")]
        public async Task<IActionResult> GetAvailableProcessed([FromQuery] int? ingredientID)
        {
            return Ok(await _batchService.GetAvailableProcessedBatches(ingredientID));
        }

        [HttpGet("by-store/{storeID}")]
        public async Task<IActionResult> GetByStore(int storeID)
        {
            storeID = User.GetStoreID() ?? storeID;
            return Ok(await _batchService.GetBatchesByStore(storeID));
        }

        // Báo cáo tồn kho toàn store: dùng cho màn hình "Kiểm Tra Kho" của admin.
        [HttpGet("store-report/{storeID}")]
        public async Task<IActionResult> GetStoreReport(int storeID)
        {
            storeID = User.GetStoreID() ?? storeID;
            try { return Ok(await _batchService.GetStoreInventoryReport(storeID)); }
            catch (Exception e) { return BadRequest(new { message = e.Message }); }
        }
    }
}
