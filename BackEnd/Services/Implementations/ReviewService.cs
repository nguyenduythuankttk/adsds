using Backend.Data;
using Backend.Converters;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interfaces;
using Backend.Models;
using MongoDB.Driver;
using Backend.Controller;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _dbContext;
        private readonly MongoDbContext _mongoDbContext;
        public ReviewService(AppDbContext dbContext, MongoDbContext mongoDbContext)
        {
            _dbContext = dbContext;
            _mongoDbContext = mongoDbContext;
        }

        public async Task<List<ReviewResponse>> GetAllReview(){
            try{
                return await _mongoDbContext.Reviews
                .Find(r => r.DeletedAt == null)
                .SortByDescending(r => r.CreatedAt)
                .Project(r => new ReviewResponse
                {
                    ReviewID = r.ReviewID,
                    Username = r.Username,
                    Comment = r.Comment,
                    Rating = r.Rating,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
            }catch(Exception ex)
            {
                throw new Exception($"An error occurred while getting all reviews {ex.Message}");
            }
        }

        public async Task<ReviewResponse> GetReviewByID(Guid reviewID) =>
            await _mongoDbContext.Reviews
            .Find(r => r.ReviewID == reviewID && r.DeletedAt == null)
            .Project(r => new ReviewResponse
            {
                ReviewID = r.ReviewID!,
                Username = r.Username,
                Comment = r.Comment,
                Rating = r.Rating,
                CreatedAt = r.CreatedAt
            })
            .FirstOrDefaultAsync();

        public async Task AddReview(Guid userID, ReviewCreateRequest createRequest)
        {
            try 
            {
                var user = await _dbContext.User
                .FirstOrDefaultAsync(u => u.UserID == userID)
                ?? throw new Exception("User not found!");

                await _mongoDbContext.Reviews.InsertOneAsync(new Review
                {
                    UserID = userID,
                    Username = user.FullName,
                    StoreID = createRequest.StoreID,
                    Rating = createRequest.Rating,
                    Comment = createRequest.Comment,
                    CreatedAt = DateTime.UtcNow,
                    DeletedAt = null
                });
                
            }catch (Exception ex)
            {
                Console.WriteLine($"Add review error {ex.Message}");
                throw new Exception($"An error occurred while adding review {ex.Message}");
            }
        }

        public async Task UpdateReview(Guid reviewId, Guid userID, ReviewUpdateRequest updateRequest)
        {
            try
            {
                var review = await _mongoDbContext.Reviews
                .Find(r => r.ReviewID == reviewId)
                .FirstOrDefaultAsync()
                ?? throw new Exception("Review not found!");

                if (review.UserID != userID)
                    throw new Exception("You dont have permission to edit this review");

                var updates = new List<UpdateDefinition<Review>>();

                if (updateRequest.Rating.HasValue)
                    updates.Add(Builders<Review>.Update.Set(r => r.Rating, updateRequest.Rating.Value));

                if (!string.IsNullOrWhiteSpace(updateRequest.Comment))
                    updates.Add(Builders<Review>.Update.Set(r => r.Comment, updateRequest.Comment));

                updates.Add(Builders<Review>.Update.Set(r => r.UpdatedAt, DateTime.Now));

                if (updates.Count == 1)
                    throw new Exception("Nothing to update");

                await _mongoDbContext.Reviews.UpdateOneAsync(
                    r => r.ReviewID == reviewId,
                    Builders<Review>.Update.Combine(updates)
                );
            }catch(Exception ex)
            {
                Console.WriteLine($"Updating review error {ex.Message}");
                throw new Exception($"An error occurred while updating review {ex.Message}" );
            }
        }

        public async Task SoftDeleteReview(Guid reviewId, Guid userId)
        {
            try
            {
                var review = await _mongoDbContext.Reviews
                    .Find(r => r.ReviewID == reviewId)
                    .FirstOrDefaultAsync()
                    ?? throw new Exception("Review not found");

                if (review.UserID != userId)
                    throw new Exception("You dont have permission to delete this comment!");

                await _mongoDbContext.Reviews.UpdateOneAsync(
                    r => r.ReviewID == reviewId,
                    Builders<Review>.Update.Set(r => r.DeletedAt, DateTime.UtcNow)
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Soft deleting revew error {ex.Message}");
                throw new Exception($"An error occurred while deleting review {ex.Message}");
            }
        }
    }
}