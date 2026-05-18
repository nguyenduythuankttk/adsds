using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class ProcessingLog
    {
        [Key]
        public Guid ProcessingID { get; set; }

        public Guid EmployeeID { get; set; }
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;

        [Required]
        public DateTime ProcessedAt { get; set; }

        public string? Note { get; set; }

        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProcessingDetail> Details { get; set; } = [];
    }

}
