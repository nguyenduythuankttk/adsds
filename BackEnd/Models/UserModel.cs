using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore; 
namespace Backend.Models {
    public enum Gender
    {
        Male, 
        Female,
        Others
    }
    
    [Index("UserName",IsUnique = true)]
    [Index("Email",IsUnique = true)]
    [Index("Phone", IsUnique = true)]
    public class User{
        [Key]
        public Guid UserID {get; set;}
        [Required, MaxLength(50)]
        public string UserName {get; set;}  = null!;
        [Required,MaxLength(255)]
        public string HashPassword {get; set;} = null!;
        public DateOnly BirthDate {get; set;} 
        public DateTime CreateAt {get; set;} = DateTime.UtcNow;
        public string? Email {get; set;}
        [Required, Phone, MaxLength(10)]
        public string Phone {get; set;} = null!;
        [Required, StringLength(100)]
        public string FullName {get; set;} = null!;
        public Gender Gender {get; set;} 
        public DateTime? DeletedAt {get; set; }
        public bool IsVerified {get; set;} = false;
        public string? EmailVerified { get; set; }
        public DateTime? VerifiedExp {get; set;}
        public string? PasswordEmail {get; set;}
        public DateTime?  PasswordEmailExp {get; set;}
        [JsonIgnore]
        public virtual ICollection<UserAddress> UserAddress { get; set; } = new List<UserAddress>();
        [JsonIgnore]
        public virtual ICollection<TicketUser> TicketUser { get; set; } = new List<TicketUser>();
    }       
}