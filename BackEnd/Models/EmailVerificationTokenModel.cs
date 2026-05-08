using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public enum TokenType {
        EmailVerification,
        PasswordReset
    }

    public class EmailVerificationToken {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserID { get; set; }

        [Required, MaxLength(255)]
        public string Token { get; set; } = null!;

        public TokenType Type { get; set; }

        public DateTime ExpiryDate { get; set; }

        public bool IsUsed { get; set; } = false;

        [JsonIgnore]
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;
    }
}
