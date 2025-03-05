// using System.ComponentModel.DataAnnotations;
// using System.ComponentModel.DataAnnotations.Schema;
// using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace DeskSpacer.GQLDB;

[GraphQLDescription("State of 3D canvas")]
public class SharedState(Guid id, string stateData, DateTime expiresAt)
{
    [GraphQLDescription("ID of DB Entry")]
    public Guid Id { get; set; } = id;

    [GraphQLDescription("The state")]
    public string StateData { get; set; } = stateData;

    [GraphQLDescription("The timestamp")]
    public DateTime ExpiresAt { get; set; } = expiresAt;
}