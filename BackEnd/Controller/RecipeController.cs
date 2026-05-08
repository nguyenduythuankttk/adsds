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
            try
            {
                var recipes = await _recipeService.GetAllRecipes();
                return Ok(recipes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in recipeController.GetAllRecipes: {ex.Message}");
            }
        }

        [HttpGet("get/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> GetRecipeByID(int ingredientID, int productVarientID)
        {
            try
            {
                var recipe = await _recipeService.GetRecipeByID(ingredientID, productVarientID);
                if (recipe == null)
                    return NotFound("Recipe not found");

                return Ok(recipe);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in recipeController.GetRecipeByID: {ex.Message}");
            }
        }


        [HttpPost("add")]
        public async Task<IActionResult> AddRecipe([FromBody] RecipeCreateRequest request)
        {
            try
            {
                await _recipeService.AddRecipe(request);
                return Ok("Add recipe successfully!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in recipeController.AddRecipe: {ex.Message}");
            }
        }

        [HttpPut("Update/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> UpdateRecipe(int ingredientID, int productVarientID, [FromBody] RecipeUpdateRequest request)
        {
            try
            {
                await _recipeService.UpdateRecipe(ingredientID, productVarientID, request);
                return Ok("Update recipe successfully!");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in recipeController.UpdateRecipe: {ex.Message}");
            }
        }

        [HttpDelete("Delete/{ingredientID}/{productVarientID}")]
        public async Task<IActionResult> DeleteRecipe(int ingredientID, int productVarientID)
        {
            try
            {
                await _recipeService.DeleteRecipe(ingredientID, productVarientID);
                return Ok("Delete recipe successfully!");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in recipeController.DeleteRecipe: {ex.Message}");
            }
        }
    }
}
