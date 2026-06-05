using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.Data;
using Backend.Helpers;
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
        private readonly IHttpClientFactory _httpClientFactory;

        public SePayService(AppDbContext db, IOptions<SePayOptions> opts, ILogger<SePayService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _opts = opts.Value;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
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

                // Log payload raw để dễ trace
                _logger.LogInformation(
                    "SePay webhook: id={Id} amount={Amount} content='{Content}' code='{Code}'",
                    payload.Id, payload.TransferAmount, payload.Content, payload.Code);

                // 2. Trích PaymentReference từ Content (vd "JLB1A2B3C4D thanh toan")
                var prefix = string.IsNullOrWhiteSpace(_opts.ReferencePrefix) ? "JLB" : _opts.ReferencePrefix;
                var pattern = $@"{Regex.Escape(prefix)}[A-Z0-9]+";
                var match = Regex.Match(payload.Content ?? string.Empty, pattern, RegexOptions.IgnoreCase);
                if (!match.Success)
                {
                    _logger.LogWarning("SePay: không tìm thấy mã {Prefix}* trong content='{Content}'. " +
                        "Nếu dùng 'Gửi thử webhook' trên dashboard SePay, content là mẫu — " +
                        "phải dùng 'Mô phỏng giao dịch' để tự nhập content chứa mã bill thật.",
                        prefix, payload.Content);
                    return false;
                }
                var reference = match.Value.ToUpper();

                // 3. Tìm bill theo PaymentReference
                var bill = await _db.Bill.FirstOrDefaultAsync(b => b.PaymentReference == reference);
                if (bill == null)
                {
                    _logger.LogWarning("SePay: không tìm thấy Bill cho PaymentReference={Ref}. " +
                        "Có thể từ payload mẫu của SePay (Gửi thử) hoặc bill đã bị xoá.",
                        reference);
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

                // 5. Đối chiếu tài khoản nhận: tiền phải vào ĐÚNG tài khoản ngân hàng
                //    của cửa hàng. CHỈ áp dụng ở production — ở TestMode bỏ qua vì
                //    "Mô phỏng giao dịch" trên SePay sandbox có thể gửi số TK bất kỳ,
                //    sẽ chặn nhầm. TestMode vẫn giữ check mã bill (ref) + số tiền.
                if (!_opts.TestMode)
                {
                    var expectedAcc = await ResolveExpectedAccountAsync(bill.StoreID);
                    if (!string.IsNullOrWhiteSpace(expectedAcc) && !string.IsNullOrWhiteSpace(payload.AccountNumber))
                    {
                        var received = payload.AccountNumber.Trim().Replace(" ", "");
                        var expected = expectedAcc.Trim().Replace(" ", "");
                        if (!string.Equals(received, expected, StringComparison.OrdinalIgnoreCase))
                        {
                            _logger.LogWarning("SePay: bill {BillID} (ref khớp) nhưng tiền vào TK '{Got}' != TK nhận '{Expected}'. Bỏ qua để tránh ghi nhận nhầm.",
                                bill.BillID, received, expected);
                            return false;
                        }
                    }
                }

                // 6. Kiểm tra số tiền – phải >= Total
                if (payload.TransferAmount < bill.Total)
                {
                    _logger.LogWarning("SePay: bill {BillID} cần {Total} nhưng chỉ nhận {Received}. Giữ Pending để xử lý thủ công.",
                        bill.BillID, bill.Total, payload.TransferAmount);
                    return false;
                }

                // 7. Đánh dấu Paid + ghi audit (logic dùng chung với verify chủ động)
                await FinalizeBillPaidAsync(bill, payload.Id, payload.TransferAmount);
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

        public async Task<bool> VerifyBillPaymentAsync(Guid billID)
        {
            var bill = await _db.Bill.FirstOrDefaultAsync(b => b.BillID == billID);
            if (bill == null)
            {
                _logger.LogWarning("SePay verify: không tìm thấy bill {BillID}", billID);
                return false;
            }

            // Đã Paid (vd webhook đã chạy trước) → xác nhận luôn, không cần query lại.
            if (bill.PaymentStatus == PaymentStatus.Paid) return true;

            // Chỉ verify đơn còn đang chờ thanh toán (Pending). Failed/khác → không xử lý.
            if (bill.PaymentStatus != PaymentStatus.Pending)
            {
                _logger.LogInformation("SePay verify: bill {BillID} đang ở trạng thái {Status}, bỏ qua.", billID, bill.PaymentStatus);
                return false;
            }

            if (string.IsNullOrWhiteSpace(bill.PaymentReference))
            {
                _logger.LogWarning("SePay verify: bill {BillID} không có PaymentReference.", billID);
                return false;
            }

            // Token query userapi: ưu tiên ApiToken, fallback ApiKey (giữ tương thích cấu hình cũ).
            var token = string.IsNullOrWhiteSpace(_opts.ApiToken) ? _opts.ApiKey : _opts.ApiToken;
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("SePay verify: chưa cấu hình SePay__ApiToken/ApiKey — không thể query userapi cho bill {BillID}.", billID);
                return false;
            }

            try
            {
                var account = await ResolveExpectedAccountAsync(bill.StoreID);
                var txns = await QueryRecentTransactionsAsync(token, account);
                var reference = bill.PaymentReference.ToUpper();

                foreach (var t in txns)
                {
                    if (t.AmountIn < bill.Total) continue;
                    if (string.IsNullOrWhiteSpace(t.Content)) continue;
                    if (!t.Content.ToUpper().Contains(reference)) continue;

                    await FinalizeBillPaidAsync(bill, t.Id, t.AmountIn);
                    _logger.LogInformation("SePay verify: bill {BillID} (ref={Ref}) → Paid qua userapi, txn={Txn}, amount={Amt}",
                        bill.BillID, reference, t.Id, t.AmountIn);
                    return true;
                }

                _logger.LogInformation("SePay verify: bill {BillID} (ref={Ref}) chưa thấy giao dịch khớp trong {N} giao dịch gần đây.",
                    bill.BillID, reference, txns.Count);
                return false;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "SePay verify: lỗi khi query userapi cho bill {BillID}", billID);
                return false;
            }
        }

        // Đánh dấu bill đã thanh toán + ghi audit. Dùng chung cho webhook (tiền tự báo về)
        // và cho nút "Tôi đã chuyển khoản" (chủ động query SePay userapi).
        private async Task FinalizeBillPaidAsync(Bill bill, long txnId, decimal amount)
        {
            var now = VnTime.Now;
            bill.PaymentStatus = PaymentStatus.Paid;
            bill.PaidAt = now;
            bill.SePayTransactionId = txnId;
            bill.MoneyReceived = amount;
            bill.MoneyGiveBack = amount - bill.Total;

            _db.BillChange.Add(new BillChange
            {
                BillChangeID = Guid.NewGuid(),
                BillID = bill.BillID,
                Status = BillStatus.Paid,
                ChangeAt = now,
                EmployeeID = null // null vì là xác nhận tự động (webhook / verify), không phải nhân viên
            });

            // Nếu là đơn giao hàng (chuyển khoản/thẻ): tiền đã về → tạo log Pending
            // để đơn xuất hiện trong quản lý giao hàng "Đơn đang chờ giao".
            var deliveryInfo = await _db.DeliveryInfo
                .Include(di => di.DeliveryLog)
                .FirstOrDefaultAsync(di => di.BillID == bill.BillID && di.DeletedAt == null);
            if (deliveryInfo != null && deliveryInfo.DeliveryLog.Count == 0)
            {
                _db.DeliveryLog.Add(new DeliveryLog
                {
                    DeliveryID = deliveryInfo.DeliveryID,
                    Status     = DeliveryStatus.Pending,
                    ChangeAt   = now,
                    EmployeeID = null,
                    Note       = deliveryInfo.Note
                });
                _logger.LogInformation("SePay: bill {BillID} là đơn giao hàng → tạo log Pending cho delivery {DeliveryID}.",
                    bill.BillID, deliveryInfo.DeliveryID);
            }

            await _db.SaveChangesAsync();
        }

        // TK ngân hàng nhận tiền: ưu tiên cấu hình chung trong .env (SePay__Account),
        // chỉ khi .env trống mới fallback về TK riêng của cửa hàng trong DB.
        private async Task<string?> ResolveExpectedAccountAsync(int storeID)
        {
            if (!string.IsNullOrWhiteSpace(_opts.Account)) return _opts.Account.Trim();
            var ba = await _db.BankAccount
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.StoreID == storeID && b.DeletedAt == null);
            return ba?.AccountNumber?.Trim();
        }

        private readonly record struct SePayTxn(long Id, string? Content, decimal AmountIn);

        // Gọi SePay userapi lấy các giao dịch gần đây của tài khoản nhận.
        // Docs: https://docs.sepay.vn/lay-danh-sach-giao-dich.html
        private async Task<List<SePayTxn>> QueryRecentTransactionsAsync(string token, string? accountNumber)
        {
            var baseUrl = string.IsNullOrWhiteSpace(_opts.BaseUrl) ? "https://my.sepay.vn" : _opts.BaseUrl.TrimEnd('/');
            var url = $"{baseUrl}/userapi/transactions/list?limit=50";
            if (!string.IsNullOrWhiteSpace(accountNumber))
                url += $"&account_number={Uri.EscapeDataString(accountNumber)}";

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("Authorization", $"Bearer {token}");

            using var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("SePay userapi trả {Status}: {Body}", (int)resp.StatusCode, body);
                return new List<SePayTxn>();
            }

            var result = new List<SePayTxn>();
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("transactions", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return result;

            foreach (var el in arr.EnumerateArray())
            {
                long id = 0;
                if (el.TryGetProperty("id", out var idEl))
                {
                    if (idEl.ValueKind == JsonValueKind.String) long.TryParse(idEl.GetString(), out id);
                    else if (idEl.ValueKind == JsonValueKind.Number) idEl.TryGetInt64(out id);
                }

                string? content = el.TryGetProperty("transaction_content", out var cEl) ? cEl.GetString() : null;

                decimal amountIn = 0;
                if (el.TryGetProperty("amount_in", out var aEl))
                {
                    if (aEl.ValueKind == JsonValueKind.String)
                        decimal.TryParse(aEl.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out amountIn);
                    else if (aEl.ValueKind == JsonValueKind.Number)
                        aEl.TryGetDecimal(out amountIn);
                }

                result.Add(new SePayTxn(id, content, amountIn));
            }
            return result;
        }
    }
}
