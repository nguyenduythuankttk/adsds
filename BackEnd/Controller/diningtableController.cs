using Backend.Helpers;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class diningTableController : ControllerBase {
        private readonly IDiningTableService _diningTable;

        public diningTableController(IDiningTableService diningTable) {
            _diningTable = diningTable;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll(int storeID) {
            storeID = User.GetStoreID() ?? storeID;
            var tables = await _diningTable.GetAllTablesInStore(storeID);
            if (tables == null) return NotFound("Not found table in " + storeID);
            return Ok(tables);
        }

        [HttpGet("get/{tableID}")]
        public async Task<IActionResult> GetByID(int tableID) {
            var table = await _diningTable.GetTableByID(tableID);
            if (table == null) return NotFound("Not found Table");
            return Ok(table);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Add(TableCreateRequest newTable) {
            newTable.StoreID = User.GetStoreID() ?? newTable.StoreID;
            await _diningTable.AddTable(newTable);
            return Ok("Create Table Successfully");
        }

        [HttpPut("update")]
        public async Task<IActionResult> Update(int tableID, TableUpdateRequest request) {
            await _diningTable.UpdateTable(tableID, request);
            return Ok("Update Table Successfully");
        }

        [HttpDelete("delete/{tableID}")]
        public async Task<IActionResult> SoftDelete(int tableID) {
            await _diningTable.SoftDeleteTable(tableID);
            return Ok("Xóa bàn thành công");
        }
    }
}
