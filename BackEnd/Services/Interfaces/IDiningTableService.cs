using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IDiningTableService {
        Task <List<DiningTable>?> GetAllTablesInStore(int storeID);
        Task <DiningTable?> GetTableByID (int ID);
        Task UpdateTable(int tableID, TableUpdateRequest request);
        Task SetISBooking(int tableID, bool status);
        Task AddTable (TableCreateRequest newTable);
        Task SoftDeleteTable(int tableID);
    }
}