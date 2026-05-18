namespace Backend.Models.DTOs.Request
{
    public class ReviewCreateRequest
    {
        public Guid StoreID {get; set; }
        public string Comment {get; set; } = null!;
        public int Rating {get; set; }
    }

    public class ReviewUpdateRequest
    {
        public string? Comment {get; set; }
        public int? Rating {get; set; }
    }
}