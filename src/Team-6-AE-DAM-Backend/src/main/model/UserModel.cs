using System.Collections.Generic;

namespace DAMBackend.Models
{
    public enum Role
    {
        User, 
        Admin
    }

    public class UserModel
    {
        public int Id { get; set; } // Auto-generated in DbContext

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public Role Role { get; set; } = Role.User;

        public bool Status { get; set; } = true;

        public ICollection<FileModel> Files { get; set; } = new HashSet<FileModel>();
        public ICollection<UserProjectRelation> UserProjectRelations { get; set; } = new HashSet<UserProjectRelation>();
    }
    
    public class UserProjectRelation
    {
        public int UserId { get; set; }
        public UserModel User { get; set; }

        public int ProjectId { get; set; }
        public ProjectModel Project { get; set; }

        public bool IsFavourite { get; set; }
        public bool WorkingOn { get; set; }
    }
}
