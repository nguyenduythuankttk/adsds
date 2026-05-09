using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Services.Interfaces;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("{reviewId}")]
        public async Task<IActionResult> GetReviewByID(Guid reviewId)
        {
            try
            {
                var review = await _reviewService.GetReviewByID(reviewId);
                if (review == null) 
                return NotFound("Review not found!");

                return Ok(review);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error ocurred in reviewController.GetStoreByID {ex.Message}");
            }
        }


        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] ReviewCreateRequest createRequest)
        {
            try
            {
                await _reviewService.AddReview(GetUserId(), createRequest);
                return Ok(new { message = "Add review sucessfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500,  $"An error ocurred in reviewController.AddReview {ex.Message}");
            }
        }

        [Authorize]
        [HttpPut("{reviewId}")]
        public async Task<IActionResult> UpdateReview( [FromBody] Guid reviewId, Guid userID, ReviewUpdateRequest updateRequest)
        {
            try
            {
                await _reviewService.UpdateReview(reviewId, GetUserId(), updateRequest);
                return Ok(new { message = "Update review sucessfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error ocurred in reviewController.Softdeletereview {ex.Message}");
            }
        }

        [Authorize]
        [HttpDelete("{reviewId}")]
        public async Task<IActionResult> DeleteReview(Guid reviewId)
        {
            try
            {
                await _reviewService.SoftDeleteReview(reviewId, GetUserId());
                return Ok("Soft delete sucessfully!");
            }
            catch (Exception ex)
            {
                return StatusCode(500,  $"An error ocurred in reviewController.Softdeletereview {ex.Message}");
            }
        }
    }
}