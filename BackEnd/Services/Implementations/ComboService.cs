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
        public async Task<ComboDetailResponse?> GetComboDetail(int comboID)
        {
            var combo = await _dbContext.Product
                .AsNoTracking()
                .Where(p => p.ProductID == comboID
                         && p.ProductType == ProductType.Combo
                         && p.DeletedAt == null)
                .Include(p => p.ProductVarient)
                .Include(p => p.ComboDetail!)
                    .ThenInclude(cd => cd.Product)
                        .ThenInclude(p => p.ProductVarient)
                .FirstOrDefaultAsync();

            if (combo == null) return null;

            var comboPrice = combo.ProductVarient
                .FirstOrDefault(v => v.Size == ProductSize.Default)?.Price
                ?? combo.ProductVarient.FirstOrDefault()?.Price;

            return new ComboDetailResponse
            {
                ComboID = combo.ProductID,
                ComboName = combo.ProductName,
                Image = combo.Image,
                Description = combo.Description,
                Price = comboPrice,
                Items = (combo.ComboDetail ?? new List<ComboDetail>())
                    .Where(cd => cd.Product != null && cd.Product.DeletedAt == null)
                    .Select(cd => new ComboItemResponse
                    {
                        ProductID = cd.Product.ProductID,
                        ProductName = cd.Product.ProductName,
                        Image = cd.Product.Image,
                        Description = cd.Product.Description,
                        ProductType = cd.Product.ProductType,
                        Qty = cd.qty,
                        UnitPrice = cd.Product.ProductVarient
                            .FirstOrDefault(v => v.Size == ProductSize.Default)?.Price
                            ?? cd.Product.ProductVarient.FirstOrDefault()?.Price
                    })
                    .ToList()
            };
        }

        public async Task CreateNewCombo(ComboCreateRequest request)
        {
            try
            {
                if (request.Products == null || request.Products.Count == 0)
                    throw new Exception("Combo must have at least one product.");

                var combo = new Product
                {
                    ProductType = ProductType.Combo,
                };
                foreach (var product in request.Products)
                {
                    Product? p = await _productService.GetProductByID(product.ProductID);
                    if (p == null) throw new Exception($"Product {product.ProductID} not found.");
                    if (p.ProductType == ProductType.Combo) throw new Exception("Combo in combo isn't accepted");
                    var comboDetail = new ComboDetail
                    {
                        ProductID = p.ProductID,
                        qty = product.qty
                    };
                    // Dùng navigation property — EF sẽ tự gán ComboID khi SaveChanges
                    combo.ComboDetail.Add(comboDetail);
                }

                // Combo chỉ có duy nhất 1 varient với Size = Default
                var comboVarient = new ProductVarient{
                    Size = ProductSize.Default,
                    Price = request.Price
                };
                combo.ProductVarient.Add(comboVarient);

                _dbContext.Product.Add(combo);
                await _dbContext.SaveChangesAsync();
            } catch(Exception e)
            {
                throw new Exception("Error in ComboService.CreateNewCombo: "+ e.Message);
            }
        }
    }
}