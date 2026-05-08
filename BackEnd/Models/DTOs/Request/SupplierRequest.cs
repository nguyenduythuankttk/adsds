namespace Backend.Models.DTOs.Request
{
    public class SupplierCreateRequest
    {

        public string SupplierName{get; set;} = null!;
        public string Phone{get; set;} = null!;
        public string Email{get; set;} = null!;
        public string TaxCode{get; set;} = null!;

    }
    public class SupplierUpdateRequest
    {
        public string? SupplierName{get; set;}
        public string? Phone{get; set;}
        public string? Email{get; set;}
        public string? TaxCode{get; set;}

    }
}