namespace Backend.Models.DTOs.Reponse
{
    public class ReviewResponse
    {
        public Guid ReviewID {get; set; }
        public int StoreID {get; set; }
        public string Username {get; set; } = null!;
        public string Comment {get; set; } = null!;
        public int Rating {get; set; }
        public DateTime CreatedAt {get; set; }

    }

    public class StoreReviewsResponse
    {
        public int StoreID {get; set; }
        public int TotalReviews {get; set; }
        public double AverageRating {get; set; }
        public List<ReviewResponse> Reviews {get; set; } = new();
    }
}