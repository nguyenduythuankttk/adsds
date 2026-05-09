namespace Backend.Models.DTOs.Reponse
{
    public class ReviewResponse
    {
        public Guid ReviewID {get; set; }
        public string Username {get; set; } = null!;
        public string Comment {get; set; } = null!;
        public int Rating {get; set; }
        public DateTime CreatedAt {get; set; }

    }

    
}