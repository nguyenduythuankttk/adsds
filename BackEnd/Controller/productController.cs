using System.Linq.Expressions;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;
namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    
    public class productController : ControllerBase
    {

        private readonly IProductService _productService;

        public productController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllProduct()
        {
            try
            {
                var products = await _productService.GetAllProduct();
                return Ok(products);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.GetAllProduct {ex.Message}");
            }
        }

        [HttpGet("get/{productID}")]
        public async Task<IActionResult> GetProductByID(int productID)
        {
            try
            {
                var product = await _productService.GetProductByID(productID);
                if(product == null)
                    return NotFound("Product not found!");

                return Ok(product);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.GetProductID {ex.Message}");
            }
        }

        [HttpPost("add-product")]
        public async Task<IActionResult> AddProduct(ProductCreateRequest request)
        {
            try
            {
                await _productService.AddProduct(request);
                return Ok("Add product successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.AddProduct {ex.Message}");
            }
        }

        [HttpPost("add-varient")]
        public async Task<IActionResult> AddProductVarient(ProductVarientCreate request)
        {
            try
            {
                await _productService.AddProductVarient(request);
                return Ok("Add product varient successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.AddProductVarient {ex.Message}");
            }
        }

        [HttpPut("update-product/{productID}")]
        public async Task<IActionResult> ProductUpdate(ProductUpdateRequest request, int productID)
        {
            try
            {
                await _productService.ProductUpdate(request, productID);
                return Ok("Update product succesfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.ProductUpdate {ex.Message}");
            }
        }

        [HttpPut("update-varient/{productID}/{productSize}")]
        public async Task<IActionResult> ProductVarientUpdate(ProductVarientUpdateRequest request, int productID, ProductSize productSize)
        {
            try
            {
                await _productService.ProductVarientUpdate(request, productID, productSize);
                return Ok("Update product succesfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.ProductUpdateVarient {ex.Message}");
            }
        }

        [HttpDelete("hard-delete-product/{productID}")]
        public async Task<IActionResult> HardDeleteProduct(int productID)
        {
            try
            {
                await _productService.HardDeleteProduct(productID);
                return Ok("Hard delete product successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.DeleteProduct {ex.Message}");
            }
        }

        [HttpDelete("hard-delete-varient/{productID}/{productSize}")]
        public async Task<IActionResult> HardDeleteProductVarient(int productID, ProductSize productSize)
        {
            try
            {
                await _productService.HardDeleteProductVarient(productID, productSize);
                return Ok("Hard delete product varient successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.HardDeleteProduct {ex.Message}");
            }
        }
    }
}