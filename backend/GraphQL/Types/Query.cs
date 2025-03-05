namespace DeskSpacer.GQLDB;


public class Query
{
    public IQueryable<SharedState> GetStates(DataContext context)
    {
        return context.SharedStates.Where(s => s.ExpiresAt > DateTime.UtcNow);
    }

    [GraphQLDescription("Get all states with matching StateData")]
    public IQueryable<SharedState> GetStatesById(
        DataContext context,
        [GraphQLDescription("The ID to match")]
        Guid id)
    {
        // Filter the states by StateData
        return context.SharedStates.Where(s => s.ExpiresAt > DateTime.UtcNow && s.Id == id);
    }
}