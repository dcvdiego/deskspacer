namespace DeskSpacer.GQLDB;
public class ExpiredStateCleanupService(IServiceProvider serviceProvider) : BackgroundService

{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly TimeSpan _checkInterval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<DataContext>();
                var expiredStates = context.SharedStates
                    .Where(s => s.ExpiresAt <= DateTime.UtcNow);

                context.SharedStates.RemoveRange(expiredStates);
                await context.SaveChangesAsync();
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }
}