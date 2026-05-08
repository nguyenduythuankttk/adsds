using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class warehouseController : ControllerBase {
        private readonly IWareHouseService _warehouseService;

        public warehouseController(IWareHouseService warehouseService) {
            _warehouseService = warehouseService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll() {
            try {
                var warehouses = await _warehouseService.GetAllWarehouse();
                if (warehouses == null || warehouses.Count == 0) return NotFound("Không có kho nào");
                return Ok(warehouses);
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.GetAll: " + e.Message);
            }
        }

        [HttpGet("get/{warehouseID}")]
        public async Task<IActionResult> GetByID(int warehouseID) {
            try {
                var warehouse = await _warehouseService.GetWarehouseByID(warehouseID);
                if (warehouse == null) return NotFound("Không tìm thấy kho");
                return Ok(warehouse);
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.GetByID: " + e.Message);
            }
        }

        [HttpGet("get-by-store/{storeID}")]
        public async Task<IActionResult> GetByStore(int storeID) {
            try {
                var warehouses = await _warehouseService.GetWarehousesByStore(storeID);
                if (warehouses == null || warehouses.Count == 0) return NotFound("Không có kho nào trong cửa hàng này");
                return Ok(warehouses);
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.GetByStore: " + e.Message);
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> Add([FromBody] WarehouseCreateRequest request) {
            try {
                await _warehouseService.AddWarehouse(request);
                return Ok("Tạo kho thành công");
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.Add: " + e.Message);
            }
        }

        [HttpPut("update/{warehouseID}")]
        public async Task<IActionResult> Update(int warehouseID, [FromBody] WarehouseUpdateRequest request) {
            try {
                await _warehouseService.UpdateWarehouse(warehouseID, request);
                return Ok("Cập nhật kho thành công");
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.Update: " + e.Message);
            }
        }

        [HttpDelete("delete/{warehouseID}")]
        public async Task<IActionResult> SoftDelete(int warehouseID) {
            try {
                await _warehouseService.SoftDeleteWarehouse(warehouseID);
                return Ok("Xóa kho thành công");
            } catch (Exception e) {
                return StatusCode(500, "Error in warehouseController.SoftDelete: " + e.Message);
            }
        }
    }
}
