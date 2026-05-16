using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Implementations{
    public class DiningTableService : IDiningTableService{
        private readonly AppDbContext _dbContext;
        public DiningTableService (AppDbContext dbContext){
            _dbContext = dbContext;
        }
        public async Task <List<DiningTable>?> GetAllTablesInStore(int storeID) 
            => await _dbContext.DiningTable
                    .Where(d => d.StoreID == storeID)
                    .ToListAsync();
        public async Task <DiningTable?> GetTableByID (int ID)
            => await _dbContext.DiningTable
                    .FirstOrDefaultAsync(t => t.TableID ==ID);
        public async Task UpdateTable(int tableID, TableUpdateRequest request){
            try{
                var table = await _dbContext.DiningTable
                            .FirstOrDefaultAsync(t => t.TableID ==tableID);
                if (table != null){
                    table.Capacity = request.Capacity;
                    await _dbContext.SaveChangesAsync();
                }
                else{
                    throw new Exception("Not Found Table");
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task AddTable (TableCreateRequest newTable){
            try {
                var a = await _dbContext.DiningTable.FirstOrDefaultAsync(t => t.TableNumber == newTable.TableNumber && t.StoreID == newTable.StoreID);
                    if (a == null){
                    var table = new DiningTable{
                        StoreID = newTable.StoreID,
                        Capacity = newTable.Capacity,
                        TableNumber = newTable.TableNumber
                    };
                    _dbContext.DiningTable.Add(table);
                    await _dbContext.SaveChangesAsync();
                } else throw new Exception("TableNumber is avaiable in this Store");
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeleteTable(int tableID){
            try{
                var table = await _dbContext.DiningTable
                                .FirstOrDefaultAsync(t => t.TableID == tableID);
                if (table == null) throw new Exception("Not Found Table");
                table.DeletedAt = DateTime.UtcNow.AddHours(7);
                _dbContext.DiningTable.Update(table);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
    }
}