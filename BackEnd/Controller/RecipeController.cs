using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [Route("api/pbl3/recipe")]
    [ApiController]
    public class RecipeController : ControllerBase
    {
        private readonly IRecipeService _recipeService;

        public RecipeController(IRecipeService recipeService)
        {
            _recipeService = recipeService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllRecipes()
        {
            return Ok(await _recipeService.GetAllRecipes());
        }

        [HttpGet("get/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> GetRecipeByID(int ingredientID, int productVarientID)
        {
            var recipe = await _recipeService.GetRecipeByID(ingredientID, productVarientID);
            if (recipe == null) return NotFound("Recipe not found");
            return Ok(recipe);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddRecipe([FromBody] RecipeCreateRequest request)
        {
            await _recipeService.AddRecipe(request);
            return Ok("Add recipe successfully!");
        }

        [HttpPut("Update/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> UpdateRecipe(int ingredientID, int productVarientID, [FromBody] RecipeUpdateRequest request)
        {
            await _recipeService.UpdateRecipe(ingredientID, productVarientID, request);
            return Ok("Update recipe successfully!");
        }

        [HttpDelete("Delete/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> DeleteRecipe(int ingredientID, int productVarientID)
        {
            await _recipeService.DeleteRecipe(ingredientID, productVarientID);
            return Ok("Delete recipe successfully!");
        }
    }
}
