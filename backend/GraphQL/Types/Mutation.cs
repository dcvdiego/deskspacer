namespace DeskSpacer.GQLDB;

public class Mutation
{
    public async Task<SharedState> AddState(DataContext context, string sharedState)
    {
        var expiresAt = DateTime.UtcNow.AddDays(15);
        var entry = new SharedState(Guid.NewGuid(), sharedState, expiresAt);
        await context.SharedStates.AddAsync(entry);
        await context.SaveChangesAsync();
        return entry;
    }
}