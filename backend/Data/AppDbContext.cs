using Microsoft.EntityFrameworkCore;
namespace DeskSpacer.GQLDB
{
    public class DataContext(DbContextOptions<DataContext> options) : DbContext(options)
    {
        public DbSet<SharedState> SharedStates { get; set; }
    }
}
