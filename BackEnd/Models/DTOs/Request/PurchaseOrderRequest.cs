using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
   public class POCreateRequest{
        public int StoreID {get; set;}
        public Guid EmployeeID {get; set;}
        public decimal TaxRate { get; set; }
        public decimal Total {get; set;}
        public string? Comment { get; set; }
   }
   public class POUpdateRequest{
        public Guid EmployeeID {get; set;}
        public PO_Status Status {get; set;}
        public string? Comment {get; set;}
   }
}