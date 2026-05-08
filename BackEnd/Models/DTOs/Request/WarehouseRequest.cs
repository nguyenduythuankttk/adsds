namespace Backend.Models.DTOs.Request
{
    public class WarehouseCreateRequest
    {
        public int StoreID { get; set; }
        public int Capacity { get; set; }
    }

    public class WarehouseUpdateRequest
    {
        public int Capacity { get; set; }
    }
}