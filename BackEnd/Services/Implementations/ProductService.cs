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
                    CategoryID = request.CategoryID,
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
        public async Task HardDeleteProduct (int productID){
            try {
                var del = await _dbContext.Product
                                .FirstOrDefaultAsync(p => p.ProductID == productID);
                if (del != null){
                    _dbContext.Product.Remove(del);
                    await _dbContext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task HardDeleteProductVarient (int productID, ProductSize size){
            try {
                var del = await _dbContext.ProductVarient
                                    .FirstOrDefaultAsync (p => p.ProductID == productID && p.Size == size);
                if (del != null){
                    _dbContext.ProductVarient.Remove(del);
                    await _dbContext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine (e.Message);
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
    } 
}