using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models {
    public class ShiftTask {
        [Key]
        public Guid TaskID { get; set; }

        public Guid ShiftID { get; set; }
        [ForeignKey("ShiftID")]
        public virtual Shift Shift { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = "";

        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }

        public Guid? CompletedByID { get; set; }
        [ForeignKey("CompletedByID")]
        public virtual Employee? CompletedBy { get; set; }

        public Guid CreatedByID { get; set; }
        [ForeignKey("CreatedByID")]
        public virtual Employee CreatedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
