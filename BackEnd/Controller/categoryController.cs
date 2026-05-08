using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class categoryController : ControllerBase{
        private readonly ICategoryService _category;
        public  categoryController (ICategoryService category){
            _category = category;
        }
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllCategory(){
            try {
                var categories = await _category.GetAllCategory();
                if (categories == null) return NotFound("Not Found Category");
                return Ok(categories);
            }
            catch (Exception e){
                return StatusCode(500, "error in Categorycontrolerr.GetAllCategory: " + e.Message); 
            }
        }
        [HttpGet("get/{categoryID}")]
        public async Task<IActionResult> GetCategoryByID(int categoryID){
            try {
                var category = await _category.GetCategoryByID(categoryID);
                if (category == null) return NotFound("Not Found Category ");
                return Ok(category);
            } catch (Exception e){
                return StatusCode(500, "error in CategoryController.GetCategoryByID: "+ e.Message);
            }
        }
        [HttpGet("get-all-product/{categoryID}")]
        public async Task<IActionResult> GetProductInCategory(int categoryID){
            try {
                var products = await _category.GetProductInCategory(categoryID);
                return Ok(products);
            } catch (Exception e){
                return StatusCode(500, "error in CategoryController.GetProductInCategory" + e.Message);
            }
        }
        [HttpPost("addCat")]
        public async Task<IActionResult> AddCategory([FromBody] Category newCategory){
            try{
                await _category.AddCategory(newCategory);
                return Ok("Create successfully");
            } catch (Exception e){
                return StatusCode(500, "error in CategoryController.Addcategory" + e.Message);
            }
        }
        [HttpDelete("deleteCat")]
        public async Task<IActionResult> DeleteCategory (int deleteCategoryID){
            try {
                await _category.DeleteCategory(deleteCategoryID);
                return Ok("Delete Successfully");
            } catch (Exception e){
                return StatusCode (500, "error in CategoryController.DeleteCate" + e.Message);
            }
        }
        [HttpPut("updateCat")]
        public async Task<IActionResult> Update (int catID, string img){
            try {
                await _category.UpdateCategory(catID,img);
                return Ok("Update Category Successfully");
            } catch (Exception e){
                return StatusCode(500, "Error in CategoryController.Update: " + e.Message);
            }
        }
    }
}