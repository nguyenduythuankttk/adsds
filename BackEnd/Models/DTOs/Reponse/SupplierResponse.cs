namespace Backend.Models.DTOs.Reponse
{
    public class SupplierResponse
    {
        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string TaxCode { get; set; } = null!;
        
        public AddressResponse Address { get; set; } = null!;
    }
}
