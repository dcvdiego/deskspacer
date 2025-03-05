using DeskSpacer.GQLDB;
using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<DataContext>((serviceProvider, options) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddGraphQLServer()
    .AddMutationConventions()
    .AddQueryType<Query>()
    .AddType<SharedState>()
    .AddMutationType<Mutation>();

builder.Services.AddHostedService<ExpiredStateCleanupService>();

builder
   .Services
   .AddCors(options =>
   {
       options.AddDefaultPolicy(builder =>
       {
           builder
.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
               .WithOrigins("https://studio.apollographql.com")
               .AllowAnyHeader()
               .AllowAnyMethod();
       });
   });
var app = builder.Build();

app.UseCors();

app.MapGraphQL();
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    await scope.ServiceProvider.GetRequiredService<DataContext>().Database.MigrateAsync();
}
// }
// app.UseHttpsRedirection();
app.Run();

