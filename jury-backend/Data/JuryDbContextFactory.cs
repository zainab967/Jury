using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace JuryApi.Data
{
    public class JuryDbContextFactory : IDesignTimeDbContextFactory<JuryDbContext>
    {
        public JuryDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");

            var optionsBuilder = new DbContextOptionsBuilder<JuryDbContext>();
            optionsBuilder.UseSqlServer(connectionString);

            return new JuryDbContext(optionsBuilder.Options);
        }
    }
}


