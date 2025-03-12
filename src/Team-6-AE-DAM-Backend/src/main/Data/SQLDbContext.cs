using Microsoft.EntityFrameworkCore;

namespace DAMBackend.Models

{
    public class SQLDbContext : DbContext
    {
        public SQLDbContext(DbContextOptions<SQLDbContext> options) : base(options) { }

        public DbSet<ProjectModel> Projects { get; set; }

        public DbSet<FileModel> Files { get; set; }

        public DbSet<MetaDataTagModel> MetadataTags { get; set; }

        public DbSet<TagBasicModel> BasicTags { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) 
        {
            // One to many betwen file and metadatatag model
            modelBuilder.Entity<FileModel>()
<<<<<<< HEAD
                .HasMany(f => f.mTags)
                .WithOne(t => t.File)
                .HasForeignKey(t => t.FileId)
                .IsRequired();
            
            // One to many betwen file and basictag model
            modelBuilder.Entity<FileModel>()
                .HasMany(f => f.bTags)
                .WithOne(t => t.File)
                .HasForeignKey(t => t.FileId)
                .IsRequired();
=======
                .HasMany(t => t.Tags)
                .WithMany(f => f.Files)
                .UsingEntity<Dictionary<string, object>>( // Create a junction table
                "FileTag", // Table name
                j => j.HasOne<TagModel>().WithMany().HasForeignKey("TagId"), // Foreign key for TagModel
                j => j.HasOne<FileModel>().WithMany().HasForeignKey("FileId"), // Foreign key for FileModel
                j => j.HasKey("FileId", "TagId") // Composite key
            );
>>>>>>> 7ef1f930a60f2ec57012cf4a63c3c8b7825d66d6

            // One to many from projects to files
            modelBuilder.Entity<ProjectModel>()
                .HasMany(p => p.Files)
                .WithOne(f => f.Project)
                .HasForeignKey(f => f.ProjectId);

            // many to many between projects and users
            modelBuilder.Entity<UserModel>()
                .HasMany(u => u.Projects)
                .WithMany(p => p.Users);

            // one to many between user and files
            modelBuilder.Entity<FileModel>()
                .HasOne(f => f.User)
                .WithMany(u => u.Files)
                .HasForeignKey(f => f.UserId)
                .IsRequired();

            // generate int for userid
            modelBuilder.Entity<UserModel>()
                .Property(u => u.Id)
                .ValueGeneratedOnAdd();

            // generate guid for fileid
            modelBuilder.Entity<FileModel>()
                .Property(f => f.Id)
                .ValueGeneratedOnAdd();

            // generate guid for projectid
            modelBuilder.Entity<ProjectModel>()
                .Property(p => p.Id)
                .ValueGeneratedOnAdd();
            
        }
    }
}

