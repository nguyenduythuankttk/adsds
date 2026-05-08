using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Implementations{
    public class ComboService : IComboService{
        private readonly AppDbContext _dbcontext;
        public ComboService(AppDbContext dbContext){
            _dbcontext = dbContext;
        }
        public async Task AddCombo (Combo newCombo){
            try {
                _dbcontext.Combo.Add(newCombo);
                await _dbcontext.SaveChangesAsync();
            }   catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task <List<Combo>?> GetAllCombo() =>
        await _dbcontext.Combo
        .AsNoTracking()
        .Include(c => c.ComboProduct)
            .ThenInclude(c => c.ProductVarient)
                .ThenInclude(c => c.Product)
        .ToListAsync();
        public async Task <List<Combo>?> GetAllComboIsActive() =>
        await _dbcontext.Combo
        .AsNoTracking()
        .Include(c => c.ComboProduct)
            .ThenInclude(c => c.ProductVarient)
                .ThenInclude(c => c.Product)
        .Where (c => c.IsActive ==true)
        .ToListAsync();
        public async Task UpdateCombo (ComboChangeRequest comboUpdate, int comboID){
            try {
                var combo = await _dbcontext.Combo.FirstOrDefaultAsync( a => a.ComboID == comboID);
                if (combo != null){
                    combo.ComboName = comboUpdate.ComboName;
                    combo.FixedPrice = comboUpdate.FixedPrice;
                    combo.IsActive = comboUpdate.IsActive;
                    _dbcontext.Combo.Update(combo);
                    await _dbcontext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task <Combo?> GetComboByID(int comboID) => await _dbcontext.Combo.FirstOrDefaultAsync( c => c.ComboID == comboID);
        
        public async Task SoftDeleteCombo(int comboID){
            var combo = await _dbcontext.Combo
                .FirstOrDefaultAsync(c => c.ComboID == comboID &&
                                    c.DeletedAt == null);
            
            if(combo == null){
                throw new Exception("Combo not found");
            }

            try{
                combo.DeletedAt = DateTime.UtcNow;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete combo error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting combo: {ex.Message}");
            }
        }
    }
}