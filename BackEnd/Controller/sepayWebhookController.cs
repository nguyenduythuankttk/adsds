using Backend.Models.DTOs.Request;
using Backend.Services;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/sepay")]
    [AllowAnonymous] // Webhook gọi từ ngoài, không có JWT của user
    public class sepayWebhookController : ControllerBase
    {
        private readonly ISePayService _sepayService;
        private readonly SePayOptions _opts;
        private readonly ILogger<sepayWebhookController> _logger;

        public sepayWebhookController(
            ISePayService sepayService,
            IOptions<SePayOptions> opts,
            ILogger<sepayWebhookController> logger)
        {
            _sepayService = sepayService;
            _opts = opts.Value;
            _logger = logger;
        }

        /// <summary>
        /// Endpoint nhận webhook từ SePay. URL công khai, xác thực bằng header
        /// "Authorization: Apikey &lt;SEPAY_API_KEY&gt;" so với SePay:ApiKey trong appsettings.
        /// Luôn trả 200 OK (kể cả khi không khớp bill) để SePay không retry vô hạn.
        /// </summary>
        [HttpPost("webhook")]
        public async Task<IActionResult> ReceiveWebhook([FromBody] SePayWebhookPayload payload)
        {
            // 1. Xác thực API key
            if (string.IsNullOrEmpty(_opts.ApiKey))
            {
                _logger.LogError("SePay:ApiKey chưa được cấu hình – từ chối mọi webhook.");
                return Unauthorized(new { success = false, message = "SePay API key not configured." });
            }

            var auth = Request.Headers["Authorization"].ToString();
            // SePay gửi dạng "Apikey XXXX" hoặc "Bearer XXXX"
            var expectedApikey = $"Apikey {_opts.ApiKey}";
            var expectedBearer = $"Bearer {_opts.ApiKey}";
            if (!string.Equals(auth, expectedApikey, StringComparison.Ordinal) &&
                !string.Equals(auth, expectedBearer, StringComparison.Ordinal))
            {
                _logger.LogWarning("SePay: webhook bị từ chối – sai API key. Authorization='{Auth}'", auth);
                return Unauthorized(new { success = false, message = "Invalid API key." });
            }

            // SePay spec yêu cầu body { "success": true } để đánh dấu webhook đã consume.
            // Trả false sẽ bị SePay retry 7 lần (kể cả khi không match bill — vô nghĩa).
            // Kết quả thực tế (bill found/paid hay không) ghi vào log, không cần báo lại SePay.
            if (payload != null)
                await _sepayService.HandleIncomingTransaction(payload);
            return Ok(new { success = true });
        }
    }
}
