using Microsoft.AspNetCore.Identity;

namespace Backend.Models.DTOs.Request
{
    public class ReceiptCreateRequest
    {
        public Guid EmployeeID { get; set; }
        public DateTime DateReceive { get; set; }
        public ReceiptStatus Status { get; set; }
    }

    public class ReceiptUpdateRequest
    {
        //public Guid EmployeeID { get; set; } -> Quang đang hơi thắc mắc vì người cập nhật thì cần thêm thuộc tính chứ nhỉ..
        public int StoreID { get; set; }
        public int SupplierID { get; set; }
        public ReceiptStatus Status { get; set; }
    }
}


