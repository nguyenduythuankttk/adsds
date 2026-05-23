namespace Backend.Models.DTOs.Reponse
{
    public class ShippingFeeResponse
    {
        public double DistanceKm { get; set; }
        public decimal ShippingFee { get; set; }
        public bool IsDeliverable { get; set; } = true;
    }
}
