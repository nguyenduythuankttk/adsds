using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
namespace Backend.Controller{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class comboController : ControllerBase{
        private readonly IComboService _comboService;
        public comboController (IComboService comboService){
            _comboService = comboService;
        }
        [HttpGet("get-all")]
        public async Task <IActionResult> GetAllCombo(){
            try {
                var combos = await _comboService.GetAllCombo();
                if (combos == null) return NotFound("Have any combo yet");
                return Ok(combos);
            }
            catch (Exception e){
                return StatusCode(500, "Error in ComboController.GetAllCombo: " + e.Message);
            }
        }
        [HttpGet("get-active")]
        public async Task <IActionResult> GetAllComboIsActive(){
            try {
                var combos = await _comboService.GetAllComboIsActive();
                if (combos == null) return NotFound("No combo is active");
                return Ok(combos);
            } catch (Exception e){
                return StatusCode(500, "Error in comboController.GetAllComboIsActive: " +e.Message);
            }
        }
        [HttpGet("get/{id}")]
        public async Task <IActionResult> GetByID (int id){
            try {
                var combo = await _comboService.GetComboByID(id);
                if (combo == null) return NotFound("Not Found");
                return Ok(combo);
            } catch (Exception e){
                return StatusCode(500, "Error in comboController.GetByID: "+ e.Message);
            }
        }
        [HttpPut("update/{comboID}")]
        public async Task <IActionResult> Update([FromBody] ComboChangeRequest request, int comboID){
            try {
                await _comboService.UpdateCombo(request, comboID);
                return Ok("Update Successfully");
            } catch (Exception e){
                return StatusCode(500, "Error in comboController.Update" + e.Message);
            }
        }
        [HttpPost("create")]
        public async Task <IActionResult> Add([FromBody] Combo request){
            try{
                await _comboService.AddCombo(request);
                return Ok("Create Successfully");
            } catch (Exception e){
                return StatusCode(500, "Error in combocontroller.Add" + e.Message);
            }
        }
        [HttpDelete("soft-delete/{comboID}")]
        public async Task<IActionResult> SoftDeleteCombo(int comboID){
            try{
                await _comboService.SoftDeleteCombo(comboID);
                return Ok("Soft delete combo successfully!");
            } catch (Exception e){
                return StatusCode(500, "Error in comboController.SoftDeleteCombo: " + e.Message);
            }
        }
    }
}