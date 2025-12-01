using JuryApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using JuryApi.Options;

namespace JuryApi.Services
{
    public class ActivityReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ActivityReminderService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

        public ActivityReminderService(
            IServiceProvider serviceProvider,
            ILogger<ActivityReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Activity Reminder Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendActivityReminders(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while checking activity reminders");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Activity Reminder Service stopped");
        }

        private async Task CheckAndSendActivityReminders(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<JuryDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var emailOptions = scope.ServiceProvider.GetRequiredService<IOptions<EmailOptions>>();

            if (!emailOptions.Value.Enabled)
            {
                _logger.LogDebug("Email service is disabled. Skipping activity reminder check.");
                return;
            }

            // Get activities that are happening today (within the next hour or just passed)
            var now = DateTime.UtcNow;
            var oneHourFromNow = now.AddHours(1);
            var oneHourAgo = now.AddHours(-1);

            var activitiesToNotify = await context.Activities
                .Where(a => a.Date >= oneHourAgo && a.Date <= oneHourFromNow)
                .ToListAsync(cancellationToken);

            if (!activitiesToNotify.Any())
            {
                return;
            }

            // Get all users to notify (all employees and jury members)
            var users = await context.Users.ToListAsync(cancellationToken);

            foreach (var activity in activitiesToNotify)
            {
                foreach (var user in users)
                {
                    try
                    {
                        await emailService.SendActivityReminderAsync(
                            user.Email,
                            user.Name,
                            activity.Name,
                            activity.Description ?? string.Empty,
                            activity.Date);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, 
                            "Failed to send activity reminder to {Email} for activity {ActivityId}", 
                            user.Email, activity.Id);
                    }
                }
            }

            _logger.LogInformation("Sent activity reminders for {Count} activities to {UserCount} users", 
                activitiesToNotify.Count, users.Count);
        }
    }
}

