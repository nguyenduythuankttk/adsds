using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interfaces
{
    public interface IReviewService
    {
        Task<List<ReviewResponse>> GetAllReview();
        // Task<ReviewResponse> GetReviewByUser(Guid userID);
        Task<ReviewResponse> GetReviewByID(Guid reviewId);
        Task AddReview(Guid userID, ReviewCreateRequest createRequest);
        Task UpdateReview(Guid reviewId, Guid userID, ReviewUpdateRequest updateRequest);
        Task SoftDeleteReview(Guid reviewId, Guid userID);
    }
}