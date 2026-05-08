namespace Backend.Models.DTOs.Request
{ 
    public class StoreUpdateRequest
    {
        public string StoreName {get; set; } = null!;

        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
  
        public int SeatingCapacity { get; set; }

        
    }
}