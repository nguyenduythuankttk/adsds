using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    // Tài khoản ngân hàng nhận tiền của 1 cửa hàng (1-1 với Store).
    // AccountNumber + BankCode dùng để sinh QR SePay và đối chiếu webhook tiền vào.
    public class BankAccount
    {
        [Key]
        public int BankAccountID { get; set; }

        public int StoreID { get; set; }
        [ForeignKey("StoreID")]
        [JsonIgnore]
        public virtual Store Store { get; set; } = null!;

        // Số tài khoản ngân hàng (hoặc số tài khoản ảo VA) đã liên kết trên SePay.
        [Required, MaxLength(30)]
        public string AccountNumber { get; set; } = null!;

        // Mã ngân hàng theo chuẩn SePay/VietQR: MB, VCB, TCB, ACB, BIDV, VPB...
        [Required, MaxLength(20)]
        public string BankCode { get; set; } = null!;

        // Tên chủ tài khoản (hiển thị/đối soát).
        [Required, MaxLength(100)]
        public string AccountHolderName { get; set; } = null!;

        public DateTime? DeletedAt { get; set; }
    }
}
