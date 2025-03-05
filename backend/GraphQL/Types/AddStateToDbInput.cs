namespace DeskSpacer.GQLDB;

public class AddStateToDbInput
{
    [GraphQLDescription("The shared state to add")]
    public required SharedState SharedState { get; set; }
}