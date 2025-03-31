using System.Data.SqlTypes;

namespace DAMBackend.Models
{

    public enum AccessLevel {
        Admin,
        Everyone
    }
    public class ProjectModel 

    {
        public int Id { get; set; }

        public required string Description {get; set;}

        public required string Name { get; set; }

        public string Status { get; set; }

        public string? Location { get; set; }

        public string? ImagePath {get; set; }

        public AccessLevel AccessLevel {get; set;}

        public string Phase { get; set;}
        
        public DateTime StartDate { get; set; }

        public DateTime LastUpdate { get; set; }
        
        public bool isArchived { get; set; }

        public ICollection<FileModel> Files { get; set;} = new HashSet<FileModel>();

        public ICollection<UserModel> Users { get; set;} = new HashSet<UserModel>();
        public ICollection<LogImage> Logs { get; set;} = new HashSet<LogImage>();

        public ICollection<ProjectTagModel> Tags { get; set; } = new HashSet<ProjectTagModel>();
        
        public ICollection<UserProjectRelation> UserProjectRelations { get; set; } = new HashSet<UserProjectRelation>();
        
        // Collection of tags with the files associated with this project
        public ICollection<TagBasicModel> bTagsFiles { get; set; } = new HashSet<TagBasicModel>();
    }
    public class ProjectBasicTag
    {
        public int ProjectId { get; set; }
        public ProjectModel Project { get; set; }

        public string BasicTagValue { get; set; }
        public TagBasicModel BasicTag { get; set; }

    }
}