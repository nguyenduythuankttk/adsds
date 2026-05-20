using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Implementations{
    public class ProductService : IProductService {
        private readonly AppDbContext _dbContext;
        public ProductService (AppDbContext dbContext){
            _dbContext = dbContext;
        }
        public async Task <List<Product>?> GetAllProduct() =>
            await _dbContext.Product
                    .Include(p => p.ProductVarient)
                    .ToListAsync();
        public async Task <Product?> GetProductByID(int productID) =>
            await _dbContext.Product
                .Include(p => p.ProductVarient)
                .FirstOrDefaultAsync(p => p.ProductID == productID);
        public async Task AddProduct(ProductCreateRequest request){
            try {
                var newProduct = new Product {
                    ProductName = request.ProductName,
                    ProductType = request.ProductType,
                    Image = request.Image,
                };
                _dbContext.Product.Add(newProduct);
                await _dbContext.SaveChangesAsync();
            }catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task AddProductVarient(ProductVarientCreate request){
            try {
                var newProductVarient = new ProductVarient {
                    ProductID = request.ProductID,
                    Price = request.Price,
                    Size = request.Size
                };
                _dbContext.ProductVarient.Add(newProductVarient);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task ProductUpdate (ProductUpdateRequest request, int productID){
            try {
                var updateProduct = await _dbContext.Product
                                            .FirstOrDefaultAsync(p => p.ProductID == productID);
                if (updateProduct != null){
                    updateProduct.ProductName = request.ProductName;
                    updateProduct.Image = request.Image;
                    _dbContext.Product.Update(updateProduct);
                    await _dbContext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task ProductVarientUpdate (ProductVarientUpdateRequest request, int productID, ProductSize size){
            try {
                var updatePV = await _dbContext.ProductVarient
                                    .FirstOrDefaultAsync (p => p.ProductID == productID && p.Size == size);
                if (updatePV != null){
                    updatePV.Price = request.Price;
                    _dbContext.ProductVarient.Update(updatePV);
                    await _dbContext.SaveChangesAsync();
                }

            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeleteProduct(int productID){
            var product = await _dbContext.Product
                .FirstOrDefaultAsync(p => p.ProductID == productID &&
                                    p.DeletedAt == null);
            
            if(product == null){
                throw new Exception("Product not found");
            }

            try{
                product.DeletedAt = DateTime.Now;
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete product error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting product: {ex.Message}");
            }
        }
        public async Task<decimal> GetPriceByID (int productVarientID)
        {
            var productVarient = await _dbContext.ProductVarient.FirstOrDefaultAsync(p => p.ProductVarientID == productVarientID);
            if (productVarient == null) throw new Exception("Not Found Product Varient");
            return productVarient.Price;
        }
        public async Task<List<Product>?> GetProductByType(ProductType type) =>
            await _dbContext.Product
                    .AsNoTracking()
                    .Where(p => p.ProductType == type)
                    .Include(p => p.ProductVarient)
                    .Include(p => p.ComboDetail)
                    .ToListAsync();

        public async Task SetIsActive(int productVarientID, bool isActive){
            var pv = await _dbContext.ProductVarient
                .FirstOrDefaultAsync(p => p.ProductVarientID == productVarientID);
            if (pv == null) throw new Exception("ProductVarient not found");
            pv.IsActive = isActive;
            await _dbContext.SaveChangesAsync();
        }

        public async Task<List<Product>> SearchProducts(ProductSearchRequest request)
        {
            var query = _dbContext.Product
                .AsNoTracking()
                .Where(p => p.DeletedAt == null)
                .Include(p => p.ProductVarient)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Name))
                query = query.Where(p => p.ProductName.Contains(request.Name));

            if (request.Type.HasValue)
                query = query.Where(p => p.ProductType == request.Type.Value);

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.ProductVarient.Any(v => v.Price >= request.MinPrice.Value && v.IsActive));

            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.ProductVarient.Any(v => v.Price <= request.MaxPrice.Value && v.IsActive));

            var products = await query.ToListAsync();

            // ForPeople: lọc combo theo số người (combo có combo detail)
            if (request.ForPeople.HasValue && request.ForPeople.Value > 0)
            {
                var forPeople = request.ForPeople.Value;
                products = products.Where(p => {
                    // Nếu là Food/Drink/Addon: giữ lại
                    if (p.ProductType != ProductType.Combo) return true;
                    // Combo: filter theo số người dựa vào tên (1-2 người, 3-4 người, ...)
                    var name = p.ProductName.ToLower();
                    return true; // Trả về tất cả combo, frontend filter tiếp nếu cần
                }).ToList();
            }

            return products;
        }
    }
}