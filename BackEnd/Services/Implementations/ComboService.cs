using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
namespace Backend.Services.Implementations
{
    public class ComboService : IComboService
    {
        private readonly AppDbContext _dbContext;
        private readonly IProductService _productService;
        public ComboService(AppDbContext dbContext, IProductService productService)
        {
            _dbContext = dbContext;
            _productService = productService;
        }
        public async Task <Product?> GetAllProductInCombo(int comboID)
        {
            try
            {
                Product? combo = await  _dbContext.Product
                                        .Include(c => c.ComboDetail)
                                        .FirstOrDefaultAsync(c => c.ProductID == comboID);
                if (combo == null) throw new Exception("Combo not found");
                if (combo?.ProductType != ProductType.Combo) throw new Exception("Combo not found");
                return combo;
            } catch (Exception e)
            {
                throw new Exception("Error in ComboService.GetAllProductInCombo" + e.Message);
            }
        }
        public async Task CreateNewCombo(ComboCreateRequest request)
        {
            try
            {
                var combo = new Product();
                foreach (var product in request.Products)
                {
                    Product? p =await _productService.GetProductByID(product.ProductID);
                    if (p?.ProductType == ProductType.Combo) throw new Exception("Combo in combo isn't acepted");
                    var comboDetail = new ComboDetail
                    {
                        ComboID =combo.ProductID,
                        ProductID = p.ProductID, 
                        qty = product.qty
                    };
                    combo.ComboDetail.Add(comboDetail);
                    _dbContext.ComboDetail.Add(comboDetail);
                }
                var comboVarient = new ProductVarient{
                    ProductID = combo.ProductID,
                    Size = ProductSize.Default,
                    Price = request.Price
                };
                combo.ProductVarient.Add(comboVarient);
                _dbContext.ProductVarient.Add(comboVarient);
                _dbContext.Product.Add(combo);
                await _dbContext.SaveChangesAsync();
            } catch(Exception e)
            {
                throw new Exception("Error in ComboService.CreateNewCombo"+ e.Message);
            }
        }
    }
}