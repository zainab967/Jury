using JuryApi.Entities;
using JuryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Data
{
    public partial class JuryDbContext : DbContext
    {
        public JuryDbContext(DbContextOptions<JuryDbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Activity> Activities { get; set; } = null!;
        public virtual DbSet<Expense> Expenses { get; set; } = null!;
        public virtual DbSet<Log> Logs { get; set; } = null!;
        public virtual DbSet<Penalty> Penalties { get; set; } = null!;
        public virtual DbSet<Tier> Tiers { get; set; } = null!;
        public virtual DbSet<User> Users { get; set; } = null!;
        public virtual DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Global query filters for soft delete
            modelBuilder.Entity<Activity>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Log>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Penalty>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Tier>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);

            modelBuilder.Entity<Activity>(entity =>
            {
                entity.ToTable("Activities");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime2");

                entity.Property(e => e.Date)
                    .HasColumnType("datetime2");
            });

            modelBuilder.Entity<Expense>(entity =>
            {
                entity.ToTable("Expenses");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.TotalCollection)
                    .HasConversion(
                        v => (int)v, // Convert decimal to int (truncate decimal part)
                        v => (decimal)v) // Convert int to decimal
                    .HasColumnType("int");

                entity.Property(e => e.Bill)
                    .HasConversion(
                        v => (int)v, // Convert decimal to int (truncate decimal part)
                        v => (decimal)v) // Convert int to decimal
                    .HasColumnType("int");

                entity.Property(e => e.Arrears)
                    .HasConversion(
                        v => (int)v, // Convert decimal to int (truncate decimal part)
                        v => (decimal)v) // Convert int to decimal
                    .HasColumnType("int");

                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Notes)
                    .HasMaxLength(2000);

                entity.Property(e => e.Date)
                    .HasColumnType("datetime2");

                // Map CreatedAt property to SubmittedAt column in database
                entity.Property(e => e.CreatedAt)
                    .HasColumnName("SubmittedAt")
                    .HasColumnType("datetime2");

                entity.HasIndex(e => e.UserId);

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Expenses)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<Log>(entity =>
            {
                entity.ToTable("Logs");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Action)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Result)
                    .HasMaxLength(1000);

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime2");

                entity.HasIndex(e => e.UserId);

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Logs)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<Penalty>(entity =>
            {
                entity.ToTable("Penalties");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Category)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Reason)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Date)
                    .HasColumnType("datetime2");

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime2");

                entity.HasIndex(e => e.Date);

                entity.HasIndex(e => e.UserId);

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Penalties)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<Tier>(entity =>
            {
                entity.ToTable("Tiers");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.CostsJson)
                    .IsRequired();
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.PasswordHash)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime2");

                // Map Role enum to/from string in database
                entity.Property(e => e.Role)
                    .HasConversion(
                        v => v.ToString(),
                        v => Enum.Parse<UserRole>(v))
                    .HasMaxLength(50);

                entity.HasIndex(e => e.Email)
                    .IsUnique();
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("RefreshTokens");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever();

                entity.Property(e => e.Token)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.ExpiresAt)
                    .HasColumnType("datetime2");

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime2");

                entity.Property(e => e.RevokedAt)
                    .HasColumnType("datetime2");

                entity.Property(e => e.RevokedByIp)
                    .HasMaxLength(50);

                entity.Property(e => e.ReplacedByToken)
                    .HasMaxLength(500);

                entity.HasIndex(e => e.Token);
                entity.HasIndex(e => e.UserId);

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
