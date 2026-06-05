namespace Backend.Models.DTOs.Reponse
{
    public class BankAccountResponse
    {
        public int BankAccountID { get; set; }
        public int StoreID { get; set; }
        public string? StoreName { get; set; }
        public string AccountNumber { get; set; } = null!;
        public string BankCode { get; set; } = null!;
        public string AccountHolderName { get; set; } = null!;
    }
}
