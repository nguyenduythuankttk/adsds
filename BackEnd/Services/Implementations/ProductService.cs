using Backend.Data;
using Backend.Helpers;
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
                    Description = request.Description,
                };
                _dbContext.Product.Add(newProduct);
                await _dbContext.SaveChangesAsync();
            }catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task AddProductVarient(ProductVarientCreate request){
            var product = await _dbContext.Product
                .Include(p => p.ProductVarient)
                .FirstOrDefaultAsync(p => p.ProductID == request.ProductID && p.DeletedAt == null);
            if (product == null)
                throw new Exception($"Product {request.ProductID} not found.");

            // Combo: chỉ chấp nhận Size = Default và tối đa 1 varient duy nhất
            if (product.ProductType == ProductType.Combo)
            {
                if (request.Size != ProductSize.Default)
                    throw new Exception("Combo chỉ chấp nhận ProductSize.Default — không cho phép size khác.");
                if (product.ProductVarient.Any(v => v.DeletedAt == null))
                    throw new Exception("Combo đã có varient Default — không thể thêm varient thứ hai.");
            }

            // Tránh trùng (ProductID, Size) cho product thường
            if (product.ProductVarient.Any(v => v.DeletedAt == null && v.Size == request.Size))
                throw new Exception($"ProductVarient cho Product {request.ProductID} với Size {request.Size} đã tồn tại.");

            var newProductVarient = new ProductVarient {
                ProductID = request.ProductID,
                Price = request.Price,
                Size = request.Size,
                ForPeople = request.ForPeople,
            };
            _dbContext.ProductVarient.Add(newProductVarient);
            await _dbContext.SaveChangesAsync();
        }
        public async Task ProductUpdate (ProductUpdateRequest request, int productID){
            try {
                var updateProduct = await _dbContext.Product
                                            .FirstOrDefaultAsync(p => p.ProductID == productID);
                if (updateProduct != null){
                    updateProduct.ProductName = request.ProductName;
                    updateProduct.Image = request.Image;
                    updateProduct.Description = request.Description;
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
                    if (request.ForPeople.HasValue) updatePV.ForPeople = request.ForPeople;
                    _dbContext.ProductVarient.Update(updatePV);
                    await _dbContext.SaveChangesAsync();
                }

            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeleteProduct(int productID){
            var product = await _dbContext.Product
                .Include(p => p.ProductVarient)
                .FirstOrDefaultAsync(p => p.ProductID == productID && p.DeletedAt == null);

            if(product == null){
                throw new Exception("Product not found");
            }

            using var tx = await _dbContext.Database.BeginTransactionAsync();
            try{
                var now = VnTime.Now;

                var activeVarients = product.ProductVarient
                    .Where(v => v.DeletedAt == null)
                    .ToList();
                var varientIDs = activeVarients.Select(v => v.ProductVarientID).ToList();

                // Cascade: soft-delete tất cả Recipe của các varient này
                if (varientIDs.Count > 0)
                {
                    var recipes = await _dbContext.Receipe
                        .Where(r => varientIDs.Contains(r.ProductVarientID) && r.DeletedAt == null)
                        .ToListAsync();
                    foreach (var r in recipes) r.DeletedAt = now;
                }

                // Cascade: soft-delete tất cả ProductVarient
                foreach (var v in activeVarients)
                {
                    v.DeletedAt = now;
                    v.IsActive = false;
                }

                product.DeletedAt = now;
                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
            }catch(Exception ex){
                await tx.RollbackAsync();
                throw new Exception($"An error occurred while soft deleting product: {ex.Message}");
            }
        }

        public async Task SoftDeleteProductVarient(int productVarientID){
            var varient = await _dbContext.ProductVarient
                .FirstOrDefaultAsync(v => v.ProductVarientID == productVarientID && v.DeletedAt == null);
            if (varient == null)
                throw new Exception("ProductVarient not found");

            using var tx = await _dbContext.Database.BeginTransactionAsync();
            try {
                var now = VnTime.Now;

                // Cascade: soft-delete tất cả Recipe gắn với varient này
                var recipes = await _dbContext.Receipe
                    .Where(r => r.ProductVarientID == productVarientID && r.DeletedAt == null)
                    .ToListAsync();
                foreach (var r in recipes) r.DeletedAt = now;

                varient.DeletedAt = now;
                varient.IsActive = false;

                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
            } catch (Exception ex) {
                await tx.RollbackAsync();
                throw new Exception($"An error occurred while soft deleting product varient: {ex.Message}");
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

            if (request.ForPeople.HasValue && request.ForPeople.Value > 0)
            {
                var n = request.ForPeople.Value;
                products = products
                    .Where(p => p.ProductVarient.Any(v =>
                        v.ForPeople.HasValue &&
                        (n >= 5 ? v.ForPeople.Value >= 5 : v.ForPeople.Value == n)))
                    .ToList();
            }

            return products;
        }

        // Tính tình trạng còn hàng của từng ProductVarient theo tồn kho 1 cửa hàng.
        // Phải khớp tuyệt đối với BillService.ConsumeIngredients để món hiển thị
        // "còn hàng" đúng bằng việc tạo bill 1 phần sẽ thành công:
        //   - chỉ lô đã sơ chế (Processed), Status Available, còn số lượng, chưa hết hạn
        //   - thuộc kho của store
        //   - nhu cầu mỗi phần = QtyAfterProcess của từng nguyên liệu trong công thức
        // Món không có công thức ⇒ luôn bán được (không tiêu hao nguyên liệu).
        public async Task<List<ProductAvailabilityResponse>> GetVarientAvailability(int storeID)
        {
            var today = VnTime.Today;

            var recipes = await _dbContext.Receipe
                .AsNoTracking()
                .Where(r => r.DeletedAt == null)
                .Select(r => new { r.ProductVarientID, r.IngredientID, r.QtyAfterProcess })
                .ToListAsync();

            var stockByIngredient = (await _dbContext.InventoryBatch
                    .AsNoTracking()
                    .Where(b => b.BatchType == BatchType.Processed
                             && b.Status == BatchStatus.Available
                             && b.QuantityOnHand > 0
                             && b.Exp >= today
                             && b.Warehouse.StoreID == storeID)
                    .Select(b => new { b.IngredientID, b.QuantityOnHand })
                    .ToListAsync())
                .GroupBy(x => x.IngredientID)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.QuantityOnHand));

            var varientIDs = await _dbContext.ProductVarient
                .AsNoTracking()
                .Where(v => v.DeletedAt == null && v.IsActive)
                .Select(v => v.ProductVarientID)
                .ToListAsync();

            var recipesByVarient = recipes
                .GroupBy(r => r.ProductVarientID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var result = new List<ProductAvailabilityResponse>();
            foreach (var vid in varientIDs)
            {
                if (!recipesByVarient.TryGetValue(vid, out var items) || items.Count == 0)
                {
                    result.Add(new ProductAvailabilityResponse { ProductVarientID = vid, IsAvailable = true, MaxServings = -1 });
                    continue;
                }

                decimal maxServings = decimal.MaxValue;
                foreach (var item in items)
                {
                    if (item.QtyAfterProcess <= 0) continue;
                    var avail = stockByIngredient.GetValueOrDefault(item.IngredientID, 0m);
                    var servings = Math.Floor(avail / item.QtyAfterProcess);
                    if (servings < maxServings) maxServings = servings;
                }
                if (maxServings == decimal.MaxValue) maxServings = -1; // mọi QtyAfterProcess <= 0

                result.Add(new ProductAvailabilityResponse
                {
                    ProductVarientID = vid,
                    IsAvailable = maxServings != 0,
                    MaxServings = maxServings
                });
            }

            return result;
        }
    }
}