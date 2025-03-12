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

        public ICollection<FileModel> Files { get; set; } = new HashSet<FileModel>();
        public ICollection<ProjectModel> Projects { get; set; } = new HashSet<ProjectModel>();
    }
}
