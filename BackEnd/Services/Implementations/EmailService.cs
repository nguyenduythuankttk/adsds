using System.Net;
using System.Net.Mail;
using Backend.Services.Interface;

namespace Backend.Services.Implementations {
    public class EmailService : IEmailService {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration) {
            _configuration = configuration;
        }

        public async Task SendVerifyEmail(string email, string verifyToken) {
            var frontendUrl = _configuration["FrontendUrl"];
            var verifyUrl = $"{frontendUrl}/verify-email?token={verifyToken}";

            var html = BuildEmailHtml(
                heading: "Xac minh dia chi email cua ban",
                body: "Cam on ban da dang ky tai khoan Jolibi. Vui long nhan vao nut ben duoi de xac minh dia chi email cua ban. Lien ket nay se het han sau 24 gio.",
                buttonUrl: verifyUrl,
                buttonText: "Xac minh Email",
                note: "Neu ban khong tao tai khoan nay, hay bo qua email nay."
            );

            Console.WriteLine($"[EmailService] Sending verify email to {email}");
            await SendEmailAsync(email, "Xac minh dia chi email cua ban", html);
            Console.WriteLine($"[EmailService] Verify email sent successfully to {email}");
        }

        public async Task SendChangePasswordEmail(string email, string resetToken) {
            var frontendUrl = _configuration["FrontendUrl"];
            var resetUrl = $"{frontendUrl}/reset-password?token={resetToken}";

            var html = BuildEmailHtml(
                heading: "Dat lai mat khau cua ban",
                body: "Chung toi nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban. Nhan vao nut ben duoi de tiep tuc. Lien ket nay se het han sau 1 gio.",
                buttonUrl: resetUrl,
                buttonText: "Dat lai mat khau",
                note: "Neu ban khong yeu cau dat lai mat khau, hay bo qua email nay."
            );

            Console.WriteLine($"[EmailService] Sending change-password email to {email}");
            await SendEmailAsync(email, "Yeu cau dat lai mat khau", html);
            Console.WriteLine($"[EmailService] Change-password email sent successfully to {email}");
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody) {
            var host = _configuration["Smtp:Host"] ?? throw new InvalidOperationException("Smtp:Host is not configured");
            var port = int.Parse(_configuration["Smtp:Port"] ?? throw new InvalidOperationException("Smtp:Port is not configured"));
            var fromEmail = _configuration["Smtp:FromEmail"] ?? throw new InvalidOperationException("Smtp:FromEmail is not configured");
            var password = _configuration["Smtp:Password"] ?? throw new InvalidOperationException("Smtp:Password is not configured");

            using var client = new SmtpClient(host, port) {
                EnableSsl = true,
                Credentials = new NetworkCredential(fromEmail, password)
            };

            using var message = new MailMessage(fromEmail, toEmail, subject, htmlBody) {
                IsBodyHtml = true
            };

            await client.SendMailAsync(message);
        }

        private static string BuildEmailHtml(
            string heading, string body,
            string buttonUrl, string buttonText, string note) {
            return
                "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/></head>" +
                "<body style=\"font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;\">" +
                "<div style=\"max-width:600px;margin:auto;background:white;border-radius:8px;padding:32px;\">" +
                "<h2 style=\"color:#d97706;\">" + heading + "</h2>" +
                "<p>" + body + "</p>" +
                "<p><a href=\"" + buttonUrl + "\" style=\"display:inline-block;background:#d97706;color:white;" +
                "padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;\">" +
                buttonText + "</a></p>" +
                "<p style=\"color:#666;font-size:14px;\">" + note + "</p>" +
                "<hr style=\"border:none;border-top:1px solid #eee;margin:24px 0;\"/>" +
                "<p style=\"color:#999;font-size:12px;\">&copy; 2025 Jolibi. Tat ca quyen duoc bao luu.</p>" +
                "</div></body></html>";
        }
    }
}
