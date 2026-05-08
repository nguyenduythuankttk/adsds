using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class TableUpdateRequest{
        public int Capacity { get; set; }
        public bool IsBooking {get; set;} 
    }
    public class TableCreateRequest{
        public int StoreID { get; set; }
        public int TableNumber { get; set; }
        public int Capacity { get; set; }
        public bool IsBooking {get; set;}  = false;
    }
}