using Backend.Data;
using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class BankAccountService : IBankAccountService
    {
        private readonly AppDbContext _db;

        public BankAccountService(AppDbContext db)
        {
            _db = db;
        }

        private static BankAccountResponse Project(BankAccount b) => new BankAccountResponse
        {
            BankAccountID = b.BankAccountID,
            StoreID = b.StoreID,
            StoreName = b.Store?.StoreName,
            AccountNumber = b.AccountNumber,
            BankCode = b.BankCode,
            AccountHolderName = b.AccountHolderName
        };

        public async Task<BankAccountResponse?> GetByStore(int storeID)
        {
            var b = await _db.BankAccount
                .AsNoTracking()
                .Include(x => x.Store)
                .FirstOrDefaultAsync(x => x.StoreID == storeID && x.DeletedAt == null);
            return b == null ? null : Project(b);
        }

        public async Task<List<BankAccountResponse>> GetAll()
        {
            var list = await _db.BankAccount
                .AsNoTracking()
                .Include(x => x.Store)
                .Where(x => x.DeletedAt == null)
                .ToListAsync();
            return list.Select(Project).ToList();
        }

        public async Task<BankAccountResponse> UpsertForStore(int storeID, BankAccountUpsertRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.AccountNumber))
                throw new Exception("Số tài khoản không được để trống.");
            if (string.IsNullOrWhiteSpace(request.BankCode))
                throw new Exception("Mã ngân hàng không được để trống.");
            if (string.IsNullOrWhiteSpace(request.AccountHolderName))
                throw new Exception("Tên chủ tài khoản không được để trống.");

            var storeExists = await _db.Store.AnyAsync(s => s.StoreID == storeID && s.DeletedAt == null);
            if (!storeExists)
                throw new Exception($"Cửa hàng {storeID} không tồn tại.");

            // Chuẩn hoá: bỏ khoảng trắng số TK, uppercase mã bank để khớp webhook ổn định.
            var accountNumber = request.AccountNumber.Trim().Replace(" ", "");
            var bankCode = request.BankCode.Trim().ToUpper();
            var holder = request.AccountHolderName.Trim();

            // Lấy cả bản ghi đã soft-delete để "hồi sinh" thay vì tạo trùng (StoreID là unique).
            var existing = await _db.BankAccount
                .Include(x => x.Store)
                .FirstOrDefaultAsync(x => x.StoreID == storeID);

            if (existing == null)
            {
                existing = new BankAccount
                {
                    StoreID = storeID,
                    AccountNumber = accountNumber,
                    BankCode = bankCode,
                    AccountHolderName = holder
                };
                _db.BankAccount.Add(existing);
            }
            else
            {
                existing.AccountNumber = accountNumber;
                existing.BankCode = bankCode;
                existing.AccountHolderName = holder;
                existing.DeletedAt = null;
            }

            await _db.SaveChangesAsync();
            return (await GetByStore(storeID))!;
        }

        public async Task DeleteForStore(int storeID)
        {
            var b = await _db.BankAccount
                .FirstOrDefaultAsync(x => x.StoreID == storeID && x.DeletedAt == null)
                ?? throw new Exception("Cửa hàng chưa có tài khoản ngân hàng.");
            b.DeletedAt = VnTime.Now;
            await _db.SaveChangesAsync();
        }
    }
}
