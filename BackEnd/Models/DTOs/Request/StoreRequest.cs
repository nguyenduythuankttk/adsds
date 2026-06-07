using Backend.Models;

namespace Backend.Models.DTOs.Request
{
    public class StoreUpdateRequest
    {
        public string StoreName {get; set; } = null!;

        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;

        public int SeatingCapacity { get; set; }


    }

    // Tạo chi nhánh mới kèm địa chỉ, tài khoản ngân hàng và tài khoản quản lý (Manager)
    // trong cùng 1 lần. Manager vừa tạo sẽ có StoreID = StoreID của store mới.
    public class StoreCreateRequest
    {
        // ----- Cửa hàng -----
        public string StoreName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int SeatingCapacity { get; set; }

        // ----- Địa chỉ (bắt buộc) -----
        public string StreetAddress { get; set; } = null!;
        public string District { get; set; } = null!;
        public string Province { get; set; } = null!;

        // ----- Tài khoản ngân hàng (bắt buộc) -----
        public string BankAccountNumber { get; set; } = null!;
        public string BankCode { get; set; } = null!;
        public string BankAccountHolderName { get; set; } = null!;

        // ----- Tài khoản quản lý (bắt buộc) -----
        public StoreManagerCreateRequest Manager { get; set; } = null!;
    }

    public class StoreManagerCreateRequest
    {
        public string UserName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? Email { get; set; }
        public DateOnly? BirthDate { get; set; }
        public Gender Gender { get; set; }
        public decimal BasicSalary { get; set; }
    }
}