using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
namespace Backend.Controller{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class ingredientController : ControllerBase {
        private readonly IIngredientService _ingredientSerive;
        public ingredientController (IIngredientService ingredientService){
            _ingredientSerive = ingredientService;
        }
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll(){
            try {
                var Ingredients = await _ingredientSerive.GetAllIngredient();
                if (Ingredients == null) return NotFound ("Not Found");
                return Ok(Ingredients);
            }
            catch (Exception e){
                return StatusCode(500, "Error in IngController.GetAll" + e.Message);
            }
        }
        [HttpGet("get/{id}")]
        public async Task <IActionResult> GetByID (int id){
            try {
                var ing = await _ingredientSerive.GetIngredientByID(id);
                if (ing == null) return NotFound("NotFound");
                return Ok(ing);
            } catch (Exception e){
                return StatusCode(500, "Error in IngController.GetByID" + e.Message);
            }
        }


    }
}