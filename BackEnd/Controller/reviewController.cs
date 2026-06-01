using Backend.Models.DTOs.Request;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class reviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public reviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        private Guid GetUserId() =>
            Guid.Parse((User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value)!);

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllReview()
        {
            return Ok(await _reviewService.GetAllReview());
        }

        [HttpGet("get/{reviewId}")]
        public async Task<IActionResult> GetReviewByID(Guid reviewId)
        {
            var review = await _reviewService.GetReviewByID(reviewId);
            if (review == null) return NotFound("Review not found!");
            return Ok(review);
        }

        [HttpGet("store/{storeId:int}")]
        public async Task<IActionResult> GetReviewsByStore(int storeId)
        {
            try
            {
                var result = await _reviewService.GetReviewsByStore(storeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in reviewController.GetReviewsByStore: {ex.Message}");
            }
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> AddReview([FromBody] ReviewCreateRequest createRequest)
        {
            try
            {
                await _reviewService.AddReview(GetUserId(), createRequest);
                return Ok("Add review successfully!");
            } catch (Exception ex)
            {
                if (ex.Message.Contains("User not found"))
                {
                    return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ hoặc tài khoản không tồn tại. Vui lòng đăng nhập lại." });
                }
                return StatusCode(500, $"An error occurred in reviewController.AddReview: {ex.Message}");
            }
        }

        [Authorize]
        [HttpPut("update/{reviewId}")]
        public async Task<IActionResult> UpdateReview(Guid reviewId, [FromBody] ReviewUpdateRequest updateRequest)
        {
            await _reviewService.UpdateReview(reviewId, GetUserId(), updateRequest);
            return Ok("Update review successfully!");
        }

        [Authorize]
        [HttpDelete("soft-delete/{reviewId}")]
        public async Task<IActionResult> DeleteReview(Guid reviewId)
        {
            await _reviewService.SoftDeleteReview(reviewId, GetUserId());
            return Ok("Soft delete successfully!");
        }
    }
}
