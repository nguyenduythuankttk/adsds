namespace Backend.Models.DTOs.Reponse
{
    public class StoreResponse //nay cho user
    { //toi thi dung dto, truoc do thi dung implementation
        public int StoreID { get; set; }
        public string StoreName {get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int TotalReviews { get; set; }
        public int TotalPoints { get; set; }
        public int SeatingCapacity { get; set; }

        public AddressResponse Address {get; set; } = null!;
    }
}