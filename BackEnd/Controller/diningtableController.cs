using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
namespace Backend.Controller{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class diningTableController : ControllerBase{
        private readonly IDiningTableService _diningTable;
        public diningTableController (IDiningTableService diningTable){
            _diningTable = diningTable;
        }
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll(int storeID){
            try{
                var tables = await _diningTable.GetAllTablesInStore(storeID);
                if (tables == null) {
                    return NotFound("Not found table in " + storeID);
                }
                return Ok(tables);
            } catch (Exception e){
                return StatusCode(500, "Error in diningtableController.GetAll: "+ e.Message);
            }
        }
        [HttpGet("get/{tableID}")]
        public async Task<IActionResult> GetByID (int tableID){
            try {
                var table = await _diningTable.GetTableByID(tableID);
                if (table == null) return NotFound("Not found Table");
                return Ok(table);
            } catch (Exception e){
                return StatusCode(500, "Error in diningtableController.GetByID: " +e.Message );
            }
        }
        [HttpPost("create")]
        public async Task<IActionResult> Add(TableCreateRequest newTable){
            try {
                await _diningTable.AddTable(newTable);
                return Ok("Create Table Successfully");
            } catch (Exception e){
                return StatusCode(500, "Error in diningtableController.Add: " +e.Message);
            }
        }
        [HttpPut("update")]
        public async Task<IActionResult> Update(int tableID, TableUpdateRequest request){
            try{
                await _diningTable.UpdateTable(tableID, request);
                return Ok("Update Table Successfully");
            } catch (Exception e){
                return StatusCode(500, "Error in diningtableController.Update" + e.Message);
            }
        }
        [HttpDelete("delete/{tableID}")]
        public async Task<IActionResult> SoftDelete(int tableID){
            try {
                await _diningTable.SoftDeleteTable(tableID);
                return Ok("Xóa bàn thành công");
            } catch (Exception e){
                return StatusCode(500, "Error in diningtableController.SoftDelete: " + e.Message);
            }
        }
    }
}