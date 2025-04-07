using Microsoft.EntityFrameworkCore;

namespace DAMBackend.Models

{
    public class SQLDbContext : DbContext
    {
        public SQLDbContext(DbContextOptions<SQLDbContext> options) : base(options) { }

        public DbSet<ProjectModel> Projects { get; set; }

        public DbSet<FileModel> Files { get; set; }
        
        public DbSet<UserModel> Users { get; set; }

        public DbSet<MetadataTagModel> MetadataTags { get; set; }

        public DbSet<TagBasicModel> BasicTags { get; set; }
        
        public DbSet<ProjectTagModel> ProjectTags { get; set; }
        
        public DbSet<UserProjectRelation> UserProjectRelations { get; set; }

        public DbSet<LogImage> LogImage { get; set; }
        
        public DbSet<FileTag> FileTags { get; set; }
        
        public DbSet<ProjectBasicTag> ProjectBasicTag {get; set;}

        protected override void OnModelCreating(ModelBuilder modelBuilder) 
        

        {
            
            // Key for basic data tag model
            modelBuilder.Entity<TagBasicModel>()
                .HasKey(m => new { m.Value });

            // Key for metadata tag model
            modelBuilder.Entity<MetadataTagModel>()
            .HasKey(m => new { m.FileId, m.Key });

            // Key for project tag model
            modelBuilder.Entity<ProjectTagModel>()
                .HasKey(t => new { t.ProjectId, t.Key });
            
            // Key for LogImage 
            modelBuilder.Entity <LogImage>()
                .HasKey(l => new { l.LogId });

            // Delete tags with Project
            modelBuilder.Entity<ProjectTagModel>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tags)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);


            // One to many betwen file and metadatatag model
            modelBuilder.Entity<FileModel>()
                .Ignore(f => f.bTags)
                .HasMany(f => f.mTags)
                .WithOne(t => t.File)
                .HasForeignKey(t => t.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            // Many to many betwen file and basictag model
            modelBuilder.Entity<FileModel>()
                .HasMany(f => f.bTags)
                .WithMany(t => t.Files)
                .UsingEntity<FileTag>(
                    j => j.HasOne(ft => ft.Tag).WithMany().HasForeignKey(ft => ft.TagId)
                        .OnDelete(DeleteBehavior.Restrict),
                    j => j.HasOne(ft => ft.File).WithMany().HasForeignKey(ft => ft.FileId)
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.ToTable("FileTag");
                         // Or any other behavior you need
                    });
            
            // Many to many between project and basictag model
            modelBuilder.Entity<ProjectModel>()
                .HasMany(p => p.bTagsFiles)
                .WithMany(tb => tb.Projects)
                .UsingEntity<ProjectBasicTag>(
                    j => j.HasOne(pt => pt.BasicTag)
                        .WithMany()
                        .HasForeignKey(pt => pt.BasicTagValue),
                    j => j.HasOne(pt => pt.Project)
                        .WithMany()
                        .HasForeignKey(pt => pt.ProjectId)
                );
            
            // One to many from projects to metadatatag model
            // modelBuilder.Entity<ProjectModel>()
            //     .HasMany(p => p.mTagsFiles)
            //     .WithOne(mt => mt.Project)
            //     .HasForeignKey(mt => mt.ProjectId)
            //     .OnDelete(DeleteBehavior.Restrict);
            

            // One to many from projects to files
            // files will be deleted when project is deleted
            modelBuilder.Entity<ProjectModel>()
                .HasMany(p => p.Files)
                .WithOne(f => f.Project)
                .HasForeignKey(f => f.ProjectId);

            // Configuring the many-to-many relationship with User and Project in the join table
            modelBuilder.Entity<UserProjectRelation>()
                .HasKey(ufp => new { ufp.UserId, ufp.ProjectId });

            // Configure the relationship between User and UserProjectRelation
            modelBuilder.Entity<UserProjectRelation>()
                .HasOne(ufp => ufp.User)
                .WithMany(u => u.UserProjectRelations)
                .HasForeignKey(ufp => ufp.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Cascade delete for User

            // Configure the relationship between Project and UserProjectRelation
            modelBuilder.Entity<UserProjectRelation>()
                .HasOne(ufp => ufp.Project)
                .WithMany(p => p.UserProjectRelations)
                .HasForeignKey(ufp => ufp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // one to many between user and files
            modelBuilder.Entity<FileModel>()
                .HasOne(f => f.User)
                .WithMany(u => u.Files)
                .HasForeignKey(f => f.UserId)
                .IsRequired();

            // one to many between project and project tags
            modelBuilder.Entity<ProjectModel>()
                .HasMany(p => p.Tags)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .IsRequired();

            // generate int for userid
            modelBuilder.Entity<UserModel>()
                .Property(u => u.Id)
                .ValueGeneratedOnAdd();

            // generate id for fileid
            modelBuilder.Entity<FileModel>()
                .Property(f => f.Id)
                .ValueGeneratedOnAdd();

            // generate id for projectid
            modelBuilder.Entity<ProjectModel>()
                .Property(p => p.Id)
                .ValueGeneratedOnAdd();

            // For SQL, defining the bounds of decimals
            modelBuilder.Entity<FileModel>()
                .Property(f => f.GPSLat)
                .HasPrecision(10, 7);

            modelBuilder.Entity<FileModel>()
                .Property(f => f.GPSLon)
                .HasPrecision(10, 7);

            modelBuilder.Entity<FileModel>()
                .Property(f => f.GPSAlt)
                .HasPrecision(10, 3);

            // one-to-many relationship between User and LogImage

            modelBuilder.Entity<LogImage>()
                .HasOne(l => l.User)
                .WithMany(u => u.Logs)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();;

            // one-to-many relationship between File and LogImage
            modelBuilder.Entity<LogImage>()
                .HasOne(l => l.File)
                .WithMany(f => f.Logs)
                .HasForeignKey(l => l.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LogImage>()
                      .HasOne(l => l.Project)
                      .WithMany(f => f.Logs)
                      .HasForeignKey(l => l.ProjectId)
                      .OnDelete(DeleteBehavior.Cascade);
            
            base.OnModelCreating(modelBuilder);
        }
    }
}
