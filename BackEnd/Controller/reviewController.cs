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
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllReview()
        {
            try
            {
                var reviews = await _reviewService.GetAllReview();
                return Ok(reviews);
            } catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in reviewController.GetAllReview: {ex.Message}");
            }
        }

        [HttpGet("get/{reviewId}")]
        public async Task<IActionResult> GetReviewByID(Guid reviewId)
        {
            try
            {
                var review = await _reviewService.GetReviewByID(reviewId);
                if (review == null)
                    return NotFound("Review not found!");

                return Ok(review);
            } catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in reviewController.GetReviewByID: {ex.Message}");
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
                return StatusCode(500, $"An error occurred in reviewController.AddReview: {ex.Message}");
            }
        }

        [Authorize]
        [HttpPut("update/{reviewId}")]
        public async Task<IActionResult> UpdateReview(Guid reviewId, [FromBody] ReviewUpdateRequest updateRequest)
        {
            try
            {
                await _reviewService.UpdateReview(reviewId, GetUserId(), updateRequest);
                return Ok("Update review successfully!");
            } catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in reviewController.UpdateReview: {ex.Message}");
            }
        }

        [Authorize]
        [HttpDelete("soft-delete/{reviewId}")]
        public async Task<IActionResult> DeleteReview(Guid reviewId)
        {
            try
            {
                await _reviewService.SoftDeleteReview(reviewId, GetUserId());
                return Ok("Soft delete successfully!");
            } catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in reviewController.DeleteReview: {ex.Message}");
            }
        }
    }
}
