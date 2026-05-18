using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller {
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class ingredientController : ControllerBase {
        private readonly IIngredientService _ingredientSerive;

        public ingredientController(IIngredientService ingredientService) {
            _ingredientSerive = ingredientService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll() {
            var ingredients = await _ingredientSerive.GetAllIngredient();
            if (ingredients == null) return NotFound("Not Found");
            return Ok(ingredients);
        }

        [HttpGet("get/{id}")]
        public async Task<IActionResult> GetByID(int id) {
            var ing = await _ingredientSerive.GetIngredientByID(id);
            if (ing == null) return NotFound("NotFound");
            return Ok(ing);
        }

        [HttpDelete("soft-delete/{id}")]
        public async Task<IActionResult> SoftDeleteIngredient(int id) {
            await _ingredientSerive.SoftDeleteIngredient(id);
            return Ok("Soft delete ingredient successfully!");
        }
    }
}
