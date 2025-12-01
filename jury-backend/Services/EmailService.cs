using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;
using JuryApi.Options;

namespace JuryApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailOptions _emailOptions;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailOptions> emailOptions, ILogger<EmailService> logger)
        {
            _emailOptions = emailOptions.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            if (!_emailOptions.Enabled)
            {
                _logger.LogDebug("Email service is disabled. Skipping email to {Email}", to);
                return;
            }

            if (string.IsNullOrWhiteSpace(_emailOptions.SmtpServer) || 
                string.IsNullOrWhiteSpace(_emailOptions.FromEmail))
            {
                _logger.LogWarning("Email configuration is missing. Email will not be sent to {Email}", to);
                return;
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_emailOptions.FromName, _emailOptions.FromEmail));
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder();
                if (isHtml)
                {
                    bodyBuilder.HtmlBody = body;
                }
                else
                {
                    bodyBuilder.TextBody = body;
                }
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(_emailOptions.SmtpServer, _emailOptions.SmtpPort, 
                    _emailOptions.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
                
                if (!string.IsNullOrWhiteSpace(_emailOptions.SmtpUsername))
                {
                    await client.AuthenticateAsync(_emailOptions.SmtpUsername, _emailOptions.SmtpPassword);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", to);
                // Don't throw - email failures shouldn't break the application
            }
        }

        public async Task SendPenaltyAddedNotificationAsync(string userEmail, string userName, string category, string reason, int amount)
        {
            var subject = "New Penalty Assigned - Jury Management System";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #d32f2f;'>New Penalty Assigned</h2>
                        <p>Dear {userName},</p>
                        <p>A new penalty has been assigned to your account:</p>
                        <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <p><strong>Category:</strong> {category}</p>
                            <p><strong>Reason:</strong> {reason}</p>
                            <p><strong>Amount:</strong> PKR {amount:N0}</p>
                        </div>
                        <p>Please log in to your account to view more details and take necessary action.</p>
                        <p style='margin-top: 30px; color: #666; font-size: 12px;'>
                            This is an automated notification from the Jury Management System.
                        </p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(userEmail, subject, body);
        }

        public async Task SendPenaltyDeletedNotificationAsync(string userEmail, string userName, string category, string reason)
        {
            var subject = "Penalty Removed - Jury Management System";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #388e3c;'>Penalty Removed</h2>
                        <p>Dear {userName},</p>
                        <p>A penalty has been removed from your account:</p>
                        <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <p><strong>Category:</strong> {category}</p>
                            <p><strong>Reason:</strong> {reason}</p>
                        </div>
                        <p>Please log in to your account to view your updated penalty status.</p>
                        <p style='margin-top: 30px; color: #666; font-size: 12px;'>
                            This is an automated notification from the Jury Management System.
                        </p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(userEmail, subject, body);
        }

        public async Task SendExpenseAddedNotificationAsync(string userEmail, string userName, decimal totalCollection, decimal bill, decimal arrears)
        {
            var subject = "New Expense Record Added - Jury Management System";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #1976d2;'>New Expense Record</h2>
                        <p>Dear {userName},</p>
                        <p>A new expense record has been added to your account:</p>
                        <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <p><strong>Total Collection:</strong> PKR {totalCollection:N2}</p>
                            <p><strong>Bill:</strong> PKR {bill:N2}</p>
                            <p><strong>Arrears:</strong> PKR {arrears:N2}</p>
                        </div>
                        <p>Please log in to your account to view more details.</p>
                        <p style='margin-top: 30px; color: #666; font-size: 12px;'>
                            This is an automated notification from the Jury Management System.
                        </p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(userEmail, subject, body);
        }

        public async Task SendActivityReminderAsync(string userEmail, string userName, string activityName, string description, DateTime activityDate)
        {
            var subject = $"Activity Reminder: {activityName} - Jury Management System";
            var formattedDate = activityDate.ToString("MMMM dd, yyyy 'at' hh:mm tt");
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #f57c00;'>Activity Reminder</h2>
                        <p>Dear {userName},</p>
                        <p>This is a reminder about an upcoming activity:</p>
                        <div style='background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f57c00;'>
                            <p><strong>Activity:</strong> {activityName}</p>
                            <p><strong>Date & Time:</strong> {formattedDate}</p>
                            {(string.IsNullOrWhiteSpace(description) ? "" : $"<p><strong>Description:</strong> {description}</p>")}
                        </div>
                        <p>Please make sure you are prepared for this activity.</p>
                        <p style='margin-top: 30px; color: #666; font-size: 12px;'>
                            This is an automated notification from the Jury Management System.
                        </p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(userEmail, subject, body);
        }
    }
}

