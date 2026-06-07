using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models {
    public class Ticket{
        [Key]
        public Guid TicketID {get; set;}
        // Tên chương trình ưu đãi (chia sẻ cho tất cả voucher cùng đợt phát hành).
        public string? Name {get; set;}
        // Mã code hiển thị/đổi của riêng từng voucher (duy nhất, ngắn gọn cho người dùng).
        public string? Code {get; set;}
        public DateOnly StartDate {get; set;}
        public DateOnly EndDate {get; set;}
        public decimal Discount {get; set;}
        public DateTime? DeletedAt {get; set;}
        public DateTime? UsedAt {get; set;}
        public Guid? UsedBy {get; set;}
        [ForeignKey("UsedBy")]
        [JsonIgnore]
        public virtual User? User {get; set;}
        [JsonIgnore]
        public virtual ICollection<TicketUser> TicketUser {get;set;} = new List<TicketUser>();
    }
}