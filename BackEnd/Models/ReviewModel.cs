using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
   
    public class Review
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public Guid ReviewID {get; set; }

        [BsonElement("userID")]
        public Guid UserID {get; set; }
        public string Username {get; set; } = null!;
        [BsonElement("storeID")]
        public Guid StoreID {get; set; }

        [Required]
        [MaxLength(1000, ErrorMessage = "Comment max 1000 keywords")]
        public string Comment {get; set; } = null!;

        [Required]
        [Range(1,5, ErrorMessage = "Rating from 1 to 5") ]
        public int Rating {get; set; } 
        [MaxLength(100, ErrorMessage = "UserName must lower than 100 keywords")]
        public string? GuestName {get; set; }
        public DateTime CreatedAt {get; set; }
        public DateTime? UpdatedAt {get; set; }
        public DateTime? DeletedAt {get; set; } 

    }
}