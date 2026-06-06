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
            return Ok(await _productService.GetAllProduct());
        }

        [HttpGet("get/{productID}")]
        public async Task<IActionResult> GetProductByID(int productID)
        {
            var product = await _productService.GetProductByID(productID);
            if (product == null) return NotFound("Product not found!");
            return Ok(product);
        }

        [HttpPost("add-product")]
        public async Task<IActionResult> AddProduct(ProductCreateRequest request)
        {
            await _productService.AddProduct(request);
            return Ok("Add product successfully!");
        }

        [HttpPost("add-varient")]
        public async Task<IActionResult> AddProductVarient(ProductVarientCreate request)
        {
            await _productService.AddProductVarient(request);
            return Ok("Add product varient successfully!");
        }

        [HttpPut("update-product/{productID}")]
        public async Task<IActionResult> ProductUpdate(ProductUpdateRequest request, int productID)
        {
            await _productService.ProductUpdate(request, productID);
            return Ok("Update product successfully!");
        }

        [HttpPut("update-varient/{productID}/{productSize}")]
        public async Task<IActionResult> ProductVarientUpdate(ProductVarientUpdateRequest request, int productID, ProductSize productSize)
        {
            await _productService.ProductVarientUpdate(request, productID, productSize);
            return Ok("Update product successfully!");
        }

        [HttpDelete("soft-delete/{productID}")]
        public async Task<IActionResult> SoftDeleteProduct(int productID)
        {
            await _productService.SoftDeleteProduct(productID);
            return Ok("Soft delete product successfully!");
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchProducts([FromBody] ProductSearchRequest request)
        {
            try
            {
                var products = await _productService.SearchProducts(request);
                return Ok(products);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.SearchProducts {ex.Message}");
            }
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            try
            {
                var products = await _productService.SearchProducts(new ProductSearchRequest());
                var featured = products
                    .Where(p => p.DeletedAt == null && p.ProductVarient.Any())
                    .OrderByDescending(p => p.SoldCount)
                    .Take(10)
                    .ToList();
                return Ok(featured);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.GetFeaturedProducts {ex.Message}");
            }
        }

        // Tình trạng còn hàng của từng ProductVarient theo tồn kho của 1 cửa hàng.
        // FE dùng để làm mờ + chặn chọn món đã hết nguyên liệu khi tạo bill.
        [HttpGet("availability/{storeID}")]
        public async Task<IActionResult> GetVarientAvailability(int storeID)
        {
            try
            {
                return Ok(await _productService.GetVarientAvailability(storeID));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.GetVarientAvailability {ex.Message}");
            }
        }

        [HttpDelete("soft-delete-varient/{productVarientID}")]
        public async Task<IActionResult> SoftDeleteProductVarient(int productVarientID)
        {
            try
            {
                await _productService.SoftDeleteProductVarient(productVarientID);
                return Ok("Soft delete product varient successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in productController.SoftDeleteProductVarient {ex.Message}");
            }
        }

    }
}
