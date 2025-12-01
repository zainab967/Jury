namespace JuryApi.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendPenaltyAddedNotificationAsync(string userEmail, string userName, string category, string reason, int amount);
        Task SendPenaltyDeletedNotificationAsync(string userEmail, string userName, string category, string reason);
        Task SendExpenseAddedNotificationAsync(string userEmail, string userName, decimal totalCollection, decimal bill, decimal arrears);
        Task SendActivityReminderAsync(string userEmail, string userName, string activityName, string description, DateTime activityDate);
    }
}

