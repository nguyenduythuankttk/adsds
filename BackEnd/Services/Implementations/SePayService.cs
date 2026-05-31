using System.Text.RegularExpressions;
using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Backend.Services.Implementations
{
    public class SePayService : ISePayService
    {
        private readonly AppDbContext _db;
        private readonly SePayOptions _opts;
        private readonly ILogger<SePayService> _logger;

        public SePayService(AppDbContext db, IOptions<SePayOptions> opts, ILogger<SePayService> logger)
        {
            _db = db;
            _opts = opts.Value;
            _logger = logger;
        }

        public async Task<bool> HandleIncomingTransaction(SePayWebhookPayload payload)
        {
            try
            {
                // 1. Chỉ xử lý giao dịch tiền vào
                if (!string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("SePay: bỏ qua giao dịch transferType={Type}", payload.TransferType);
                    return false;
                }

                // 2. Trích PaymentReference từ Content (vd "JLB1A2B3C4D thanh toan")
                var prefix = string.IsNullOrWhiteSpace(_opts.ReferencePrefix) ? "JLB" : _opts.ReferencePrefix;
                var pattern = $@"{Regex.Escape(prefix)}[A-Z0-9]+";
                var match = Regex.Match(payload.Content ?? string.Empty, pattern, RegexOptions.IgnoreCase);
                if (!match.Success)
                {
                    _logger.LogWarning("SePay: không tìm thấy mã {Prefix}* trong content='{Content}'", prefix, payload.Content);
                    return false;
                }
                var reference = match.Value.ToUpper();

                // 3. Tìm bill theo PaymentReference
                var bill = await _db.Bill.FirstOrDefaultAsync(b => b.PaymentReference == reference);
                if (bill == null)
                {
                    _logger.LogWarning("SePay: không tìm thấy Bill cho PaymentReference={Ref}", reference);
                    return false;
                }

                // 4. Idempotency: đã xử lý webhook này rồi → bỏ qua, không throw
                if (bill.SePayTransactionId == payload.Id)
                {
                    _logger.LogInformation("SePay: giao dịch id={Id} đã xử lý cho bill {BillID}, bỏ qua.", payload.Id, bill.BillID);
                    return false;
                }

                if (bill.PaymentStatus == PaymentStatus.Paid)
                {
                    _logger.LogWarning("SePay: bill {BillID} đã Paid trước đó (txn={ExistingTxn}), giao dịch mới {NewTxn} bị bỏ qua.",
                        bill.BillID, bill.SePayTransactionId, payload.Id);
                    return false;
                }

                // 5. Kiểm tra số tiền – phải >= Total
                if (payload.TransferAmount < bill.Total)
                {
                    _logger.LogWarning("SePay: bill {BillID} cần {Total} nhưng chỉ nhận {Received}. Giữ Pending để xử lý thủ công.",
                        bill.BillID, bill.Total, payload.TransferAmount);
                    return false;
                }

                // 6. Đánh dấu Paid + ghi audit
                var now = DateTime.UtcNow.AddHours(7);
                bill.PaymentStatus = PaymentStatus.Paid;
                bill.PaidAt = now;
                bill.SePayTransactionId = payload.Id;
                bill.MoneyReceived = payload.TransferAmount;
                bill.MoneyGiveBack = payload.TransferAmount - bill.Total;

                _db.BillChange.Add(new BillChange
                {
                    BillChangeID = Guid.NewGuid(),
                    BillID = bill.BillID,
                    Status = BillStatus.Paid,
                    ChangeAt = now,
                    EmployeeID = null // null vì là webhook tự động, không phải nhân viên
                });

                await _db.SaveChangesAsync();
                _logger.LogInformation("SePay: bill {BillID} (ref={Ref}) → Paid, txn={Txn}, amount={Amt}",
                    bill.BillID, reference, payload.Id, payload.TransferAmount);
                return true;
            }
            catch (Exception e)
            {
                // Không throw – chỉ log – để controller vẫn trả 200, SePay không retry vô hạn
                _logger.LogError(e, "SePay: lỗi khi xử lý webhook payload id={Id}", payload.Id);
                return false;
            }
        }
    }
}
