using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
   
    public class Review
    {
        [BsonId]
        public Guid ReviewID {get; set; }

        [BsonElement("userID")]
        public Guid UserID {get; set; }

        [BsonElement("username")]
        public string Username {get; set; } = null!;

        [BsonElement("storeID")]
        public Guid StoreID {get; set; }

        [BsonElement("comment")]
        [Required]
        [MaxLength(1000, ErrorMessage = "Comment max 1000 keywords")]
        public string Comment {get; set; } = null!;

        [BsonElement("rating")]
        [Required]
        [Range(1,5, ErrorMessage = "Rating from 1 to 5") ]
        public int Rating {get; set; }

[BsonElement("createdAt")]
        public DateTime CreatedAt {get; set; }

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt {get; set; }

        [BsonElement("deletedAt")]
        public DateTime? DeletedAt {get; set; }

    }
}