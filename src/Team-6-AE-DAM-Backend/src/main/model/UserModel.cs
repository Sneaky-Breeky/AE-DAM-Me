using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public Role Role { get; set; } = Role.User;

        [Required]
        public bool Status { get; set; } = true;

        // Set limit to 100 
        public ICollection<FileModel> Files { get; set; } = new HashSet<FileModel>();
        public ICollection<UserProjectRelation> UserProjectRelations { get; set; } = new HashSet<UserProjectRelation>();
        public ICollection<LogImage> Logs { get; set;} = new HashSet<LogImage>();

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
