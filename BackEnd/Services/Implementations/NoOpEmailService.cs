using Backend.Services.Interface;

namespace Backend.Services.Implementations {
    public class NoOpEmailService : IEmailService {
        private readonly ILogger<NoOpEmailService> _logger;

        public NoOpEmailService(ILogger<NoOpEmailService> logger) {
            _logger = logger;
        }

        public Task SendVerifyEmail(string email, string verifyToken) {
            _logger.LogWarning("Email service disabled (no API key). Skipped SendVerifyEmail to {Email}", email);
            return Task.CompletedTask;
        }

        public Task SendChangePasswordEmail(string email, string resetToken) {
            _logger.LogWarning("Email service disabled (no API key). Skipped SendChangePasswordEmail to {Email}", email);
            return Task.CompletedTask;
        }
    }
}
